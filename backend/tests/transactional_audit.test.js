import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { menuService } from '../src/services/menuService.js';
import { slotService } from '../src/services/slotService.js';
import { supabaseAdmin, isSupabaseConfigured } from '../src/config/supabase.js';

async function getItem(id) {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data } = await supabaseAdmin.from('menu_items').select('*').eq('id', id).maybeSingle();
    if (data) return data;
  }
  return menuService.getItemById(id);
}

async function getSlot(id) {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data } = await supabaseAdmin.from('pickup_slots').select('*').eq('id', id).maybeSingle();
    if (data) return data;
  }
  const slots = await slotService.getSlots();
  return slots.find(s => s.id === id);
}

test('QueueBite Transactional Order Processing Audit', async (t) => {
  // 1. Setup Student & Admin tokens
  const sRes = await request(app).post('/api/v1/auth/login').send({
    role: 'student',
    rollNo: 'TX-STUDENT-01',
    name: 'Transactional Tester'
  });
  const studentToken = sRes.body.token;

  const admRes = await request(app).post('/api/v1/auth/login').send({
    role: 'admin',
    username: 'admin',
    password: 'admin123'
  });
  const adminToken = admRes.body.token;

  // Retrieve an available slot (ensure generous capacity for test suite)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const slotsRes = await request(app).get(`/api/v1/slots/available?date=${tomorrow}`);
  const testSlot = slotsRes.body.find(s => s.start_time.startsWith('10:')) || slotsRes.body[4] || slotsRes.body[0];
  const testSlotId = testSlot.id;
  await slotService.updateCapacity(testSlotId, 60);

  await t.test('1. Successful order placement deducts stock and increments slot', async () => {
    // Create a special test item with exact stock 5
    const itemRes = await request(app)
      .post('/api/v1/menu')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Tx Test Roll',
        price: 40,
        stock: 5,
        is_available: true
      });
    const txItemId = itemRes.body.id;

    const initialSlot = await getSlot(testSlotId);
    const initialBooked = initialSlot.booked_count;

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        pickupSlotId: testSlotId,
        paymentMethod: 'UPI',
        items: [{ menu_item_id: txItemId, quantity: 2 }]
      });

    assert.equal(res.status, 201);
    const itemAfter = await getItem(txItemId);
    assert.equal(itemAfter.stock, 3, 'Stock should be deducted from 5 to 3');
    const slotAfter = await getSlot(testSlotId);
    assert.equal(slotAfter.booked_count, initialBooked + 1, 'Slot booked_count should increment by 1');
  });

  await t.test('2. Rejects order when stock is insufficient and does not partially deduct', async () => {
    const itemRes = await request(app)
      .post('/api/v1/menu')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Tx Low Stock Item',
        price: 50,
        stock: 2,
        is_available: true
      });
    const txItemId = itemRes.body.id;

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        pickupSlotId: testSlotId,
        paymentMethod: 'UPI',
        items: [{ menu_item_id: txItemId, quantity: 5 }]
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /insufficient stock/i);
    const itemAfter = await getItem(txItemId);
    assert.equal(itemAfter.stock, 2, 'Stock must remain 2 after rejected order');
  });

  await t.test('3. Rejects order for unavailable menu items', async () => {
    const itemRes = await request(app)
      .post('/api/v1/menu')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Tx Unavailable Item',
        price: 30,
        stock: 10,
        is_available: false
      });
    const txItemId = itemRes.body.id;

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        pickupSlotId: testSlotId,
        paymentMethod: 'UPI',
        items: [{ menu_item_id: txItemId, quantity: 1 }]
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /not available|currently unavailable/i);
  });

  await t.test('4. Rejects order when pickup slot is blocked', async () => {
    // Block the slot
    await request(app)
      .patch(`/api/v1/slots/${testSlotId}/block`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ blocked: true });

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        pickupSlotId: testSlotId,
        paymentMethod: 'UPI',
        items: [{ menu_item_id: '00000000-0000-0000-0000-000000000001', quantity: 1 }]
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /blocked/i);

    // Unblock slot for remaining tests
    await request(app)
      .patch(`/api/v1/slots/${testSlotId}/block`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ blocked: false });
  });

  await t.test('5. Rejects order when canteen is closed', async () => {
    // Close canteen
    await request(app)
      .post('/api/v1/canteen/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ open: false });

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        pickupSlotId: testSlotId,
        paymentMethod: 'UPI',
        items: [{ menu_item_id: '00000000-0000-0000-0000-000000000001', quantity: 1 }]
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /canteen is currently closed/i);

    // Re-open canteen
    await request(app)
      .post('/api/v1/canteen/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ open: true });
  });

  await t.test('6. Two simultaneous requests competing for final stock unit (race condition handling)', async () => {
    // Create an item with exactly 1 unit
    const itemRes = await request(app)
      .post('/api/v1/menu')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Tx Single Stock Item',
        price: 25,
        stock: 1,
        is_available: true
      });
    const singleItemId = itemRes.body.id;

    // Send two concurrent requests
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          pickupSlotId: testSlotId,
          paymentMethod: 'UPI',
          items: [{ menu_item_id: singleItemId, quantity: 1 }]
        }),
      request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          pickupSlotId: testSlotId,
          paymentMethod: 'UPI',
          items: [{ menu_item_id: singleItemId, quantity: 1 }]
        })
    ]);

    const statuses = [res1.status, res2.status].sort();
    assert.deepEqual(statuses, [201, 400], 'One order must succeed (201) and the second must be rejected (400)');
    const finalItem = await getItem(singleItemId);
    assert.equal(finalItem.stock, 0, 'Final stock should be exactly 0, never negative');
  });

  await t.test('7. Two simultaneous requests competing for final slot capacity', async () => {
    const slotObj = await getSlot(testSlotId);
    const oldMax = slotObj.max_orders;
    const oldBooked = slotObj.booked_count;

    // Set capacity so only 1 slot remains
    await slotService.updateCapacity(testSlotId, oldBooked + 1);

    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          pickupSlotId: testSlotId,
          paymentMethod: 'UPI',
          items: [{ menu_item_id: '00000000-0000-0000-0000-000000000001', quantity: 1 }]
        }),
      request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          pickupSlotId: testSlotId,
          paymentMethod: 'UPI',
          items: [{ menu_item_id: '00000000-0000-0000-0000-000000000001', quantity: 1 }]
        })
    ]);

    const statuses = [res1.status, res2.status].sort();
    assert.deepEqual(statuses, [201, 400], 'One request fills slot (201), the other receives 400 (fully booked)');

    // Restore slot capacity
    await slotService.updateCapacity(testSlotId, oldMax + 5);
  });

  await t.test('8. Order cancellation restores inventory and capacity exactly once', async () => {
    // Create an item with stock 10
    const itemRes = await request(app)
      .post('/api/v1/menu')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Tx Cancel Test Item',
        price: 50,
        stock: 10,
        is_available: true
      });
    const cancelItemId = itemRes.body.id;

    const slot = await getSlot(testSlotId);
    const bookedBefore = slot.booked_count;

    // Place order for 3 items
    const placeRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        pickupSlotId: testSlotId,
        paymentMethod: 'UPI',
        items: [{ menu_item_id: cancelItemId, quantity: 3 }]
      });
    assert.equal(placeRes.status, 201);
    const orderId = placeRes.body.order_id;

    const itemAfterOrder = await getItem(cancelItemId);
    assert.equal(itemAfterOrder.stock, 7);
    const slotAfterOrder = await getSlot(testSlotId);
    assert.equal(slotAfterOrder.booked_count, bookedBefore + 1);

    // Cancel the order
    const cancelRes = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reason: 'Student cancelled' });
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.body.order_status, 'Cancelled');
    assert.equal(cancelRes.body.payment_status, 'Refunded');

    // Verify stock restored
    const itemAfterCancel = await getItem(cancelItemId);
    assert.equal(itemAfterCancel.stock, 10, 'Stock restored back to 10');
    const slotAfterCancel = await getSlot(testSlotId);
    assert.equal(slotAfterCancel.booked_count, bookedBefore, 'Slot booked count decremented back');

    // Attempt second cancellation on terminal order
    const secondCancelRes = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reason: 'Duplicate cancel' });
    assert.equal(secondCancelRes.status, 400, 'Duplicate cancel must fail with 400');
    // Ensure stock was NOT restored again
    const itemFinal = await getItem(cancelItemId);
    assert.equal(itemFinal.stock, 10, 'Stock must not be restored twice');
  });
});
