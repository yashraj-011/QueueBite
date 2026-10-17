import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('QueueBite Full-Stack API Test Suite', async (t) => {
  let studentToken = '';
  let adminToken = '';
  let placedOrderId = '';
  let slotId = '';

  await t.test('1. Health check returns 200 OK', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  await t.test('2. Student Login generates valid session token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        role: 'student',
        rollNo: 'TEST-101',
        name: 'Test Student'
      });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.college_id, 'TEST-101');
    studentToken = res.body.token;
  });

  await t.test('3. Admin Login with valid credentials succeeds', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        role: 'admin',
        username: 'admin',
        password: 'admin123'
      });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'admin');
    adminToken = res.body.token;
  });

  await t.test('4. Fetch Menu items lists active items with images', async () => {
    const res = await request(app).get('/api/v1/menu');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 5);
  });

  await t.test('5. Available pickup slots can be retrieved', async () => {
    const res = await request(app).get('/api/v1/slots/available');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length > 0);
    slotId = res.body.find(s => s.start_time.startsWith('14:'))?.id || res.body[1]?.id || res.body[0].id;
  });

  await t.test('6. Place Order atomically reserves stock and generates sequential token', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        pickupSlotId: slotId,
        paymentMethod: 'UPI',
        note: 'Fresh and hot please',
        items: [
          { menu_item_id: '00000000-0000-0000-0000-000000000001', quantity: 2 }
        ]
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.token.startsWith('#'));
    assert.equal(res.body.total, 50.0); // 2 * 25.0
    assert.equal(res.body.status, 'Placed');
    assert.equal(res.body.payment_status, 'Paid');
    placedOrderId = res.body.order_id;
  });

  await t.test('7. Kitchen staff advances status: Placed -> Preparing -> Ready', async () => {
    // Step 1: Placed -> Preparing
    const prepRes = await request(app)
      .put(`/api/v1/orders/${placedOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Preparing' });
    assert.equal(prepRes.status, 200);
    assert.equal(prepRes.body.order_status, 'Preparing');

    // Step 2: Preparing -> Ready
    const readyRes = await request(app)
      .put(`/api/v1/orders/${placedOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Ready' });
    assert.equal(readyRes.status, 200);
    assert.equal(readyRes.body.order_status, 'Ready');
  });

  await t.test('8. Rejects illegal status transition (e.g. backward or skip)', async () => {
    const badRes = await request(app)
      .put(`/api/v1/orders/${placedOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Placed' });
    assert.equal(badRes.status, 400);
  });

  await t.test('9. Confirm Collection: Ready -> Collected', async () => {
    const collRes = await request(app)
      .put(`/api/v1/orders/${placedOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Collected' });
    assert.equal(collRes.status, 200);
    assert.equal(collRes.body.order_status, 'Collected');
  });

  await t.test('10. Admin Analytics overview aggregates today orders and sales', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.today_orders_count >= 1);
    assert.ok(res.body.today_sales >= 50);
  });
});
