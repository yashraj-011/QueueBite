import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { slotService } from '../src/services/slotService.js';

test('QueueBite Security Audit Verification', async (t) => {
  let student1Token = '';
  let student2Token = '';
  let adminToken = '';
  let orderIdStudent1 = '';

  // Setup test tokens
  const s1Res = await request(app).post('/api/v1/auth/login').send({
    role: 'student',
    rollNo: 'SEC-STUDENT-01',
    name: 'Student One'
  });
  student1Token = s1Res.body.token;

  const s2Res = await request(app).post('/api/v1/auth/login').send({
    role: 'student',
    rollNo: 'SEC-STUDENT-02',
    name: 'Student Two'
  });
  student2Token = s2Res.body.token;

  const admRes = await request(app).post('/api/v1/auth/login').send({
    role: 'admin',
    username: 'admin',
    password: 'admin123'
  });
  adminToken = admRes.body.token;

  // Retrieve an available slot (ensure sufficient capacity for tests)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const slotRes = await request(app).get(`/api/v1/slots/available?date=${tomorrow}`);
  const validSlot = slotRes.body[0] || (await request(app).get('/api/v1/slots/available')).body[0];
  const validSlotId = validSlot.id;
  await slotService.updateCapacity(validSlotId, 50);

  const placeRes = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({
      pickupSlotId: validSlotId,
      paymentMethod: 'UPI',
      items: [{ menu_item_id: '00000000-0000-0000-0000-000000000001', quantity: 1 }]
    });
  orderIdStudent1 = placeRes.body.order_id;

  await t.test('1. Unauthenticated requests to protected endpoints return 401 Unauthorized', async () => {
    // a. GET /api/v1/orders/my-orders
    const r1 = await request(app).get('/api/v1/orders/my-orders');
    assert.equal(r1.status, 401, 'Expected 401 for unauthenticated /orders/my-orders');

    // b. GET /api/v1/admin/analytics/overview
    const r2 = await request(app).get('/api/v1/admin/analytics/overview');
    assert.equal(r2.status, 401, 'Expected 401 for unauthenticated /admin/analytics/overview');

    // c. POST /api/v1/orders
    const r3 = await request(app).post('/api/v1/orders').send({ pickupSlotId: validSlotId, items: [] });
    assert.equal(r3.status, 401, 'Expected 401 for unauthenticated /orders');
  });

  await t.test('2. Student access to another student order is blocked with 403 Forbidden', async () => {
    const crossRes = await request(app)
      .get(`/api/v1/orders/${orderIdStudent1}`)
      .set('Authorization', `Bearer ${student2Token}`);
    assert.equal(crossRes.status, 403, `Expected 403 Forbidden, got ${crossRes.status}: ${crossRes.body.message}`);
  });

  await t.test('3. Student attempts to access admin endpoints return 403 Forbidden', async () => {
    // a. Analytics overview
    const r1 = await request(app)
      .get('/api/v1/admin/analytics/overview')
      .set('Authorization', `Bearer ${student1Token}`);
    assert.equal(r1.status, 403, 'Expected 403 for student accessing admin analytics');

    // b. Toggle canteen status
    const r2 = await request(app)
      .post('/api/v1/canteen/status')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ open: false });
    assert.equal(r2.status, 403, 'Expected 403 for student toggling canteen status');

    // c. Create menu item
    const r3 = await request(app)
      .post('/api/v1/menu')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ name: 'Hacked Item', price: 10 });
    assert.equal(r3.status, 403, 'Expected 403 for student creating menu item');
  });

  await t.test('4. Student attempts to advance order status return 403 Forbidden', async () => {
    const res = await request(app)
      .put(`/api/v1/orders/${orderIdStudent1}/status`)
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ status: 'Preparing' });
    assert.equal(res.status, 403, 'Expected 403 Forbidden for student updating order status');
  });

  await t.test('5. Student attempts to modify payment status return 403 Forbidden', async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${orderIdStudent1}/payment`)
      .set('Authorization', `Bearer ${student1Token}`)
      .send({});
    assert.equal(res.status, 403, 'Expected 403 Forbidden for student marking payment');
  });

  await t.test('6. Client attempts to tamper with total or token number are ignored and recalculated on server', async () => {
    const tamperRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        pickupSlotId: validSlotId,
        paymentMethod: 'UPI',
        total: 1.0, // Attempted tamper: real is 2 * 25 = 50
        token: '#999-TAMPERED', // Attempted tamper token
        items: [{ menu_item_id: '00000000-0000-0000-0000-000000000001', quantity: 2 }]
      });
    assert.equal(tamperRes.status, 201);
    assert.equal(tamperRes.body.total, 50.0, 'Server must enforce calculated total (50.0), ignoring client total (1.0)');
    assert.notEqual(tamperRes.body.token, '#999-TAMPERED', 'Server must generate sequential token, ignoring client token');
  });

  await t.test('7. Invalid order-status transitions are rejected with 400 Bad Request', async () => {
    // Create new order in 'Placed' status
    const oRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        pickupSlotId: validSlotId,
        items: [{ menu_item_id: '00000000-0000-0000-0000-000000000001', quantity: 1 }]
      });
    assert.equal(oRes.status, 201);
    const testOrderId = oRes.body.order_id;

    // Attempt illegal transition directly to 'Collected' (skipping Preparing and Ready)
    const skipRes = await request(app)
      .put(`/api/v1/orders/${testOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Collected' });
    assert.equal(skipRes.status, 400, 'Expected 400 for skipping workflow states');

    // Attempt illegal transition backwards from Placed to Placed
    const backRes = await request(app)
      .put(`/api/v1/orders/${testOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Placed' });
    assert.equal(backRes.status, 400, 'Expected 400 for no-op / backward transition');
  });
});
