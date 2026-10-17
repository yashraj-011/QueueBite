import { Router } from 'express';
import { orderService } from '../services/orderService.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Student: POST /api/v1/orders (Place order)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { pickupSlotId, slot_id, paymentMethod, note, items } = req.body;
    const slotId = pickupSlotId || slot_id;
    const result = await orderService.placeOrder({
      userId: req.user.id,
      pickupSlotId: slotId,
      paymentMethod,
      note,
      items
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// Student: GET /api/v1/orders/my-orders
router.get('/my-orders', authenticate, async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;
    const result = await orderService.getOrders({
      userId: req.user.id,
      status,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Staff/Admin: GET /api/v1/orders
router.get('/', authenticate, requireRole('staff', 'admin'), async (req, res, next) => {
  try {
    const { status, date, search, limit, offset } = req.query;
    const result = await orderService.getOrders({
      status,
      date,
      search,
      limit: parseInt(limit, 10) || 100,
      offset: parseInt(offset, 10) || 0
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Token verification for counter dispatch: GET /api/v1/orders/token/:token
router.get('/token/:token', authenticate, requireRole('staff', 'admin'), async (req, res, next) => {
  try {
    const order = await orderService.getOrderByToken(req.params.token);
    if (!order) {
      return res.status(404).json({ message: `No order found for token #${req.params.token}` });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/orders/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/orders/:id/status (Transition status: Placed -> Preparing -> Ready -> Collected)
router.put('/:id/status', authenticate, requireRole('staff', 'admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await orderService.updateStatus(req.params.id, status, req.user.role);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/orders/:id/cancel
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const cancelled = await orderService.cancelOrder(req.params.id, {
      reason,
      cancelledBy: req.user.role,
      userRole: req.user.role,
      userId: req.user.id
    });
    res.json(cancelled);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/orders/:id/payment (Mark paid by staff)
router.patch('/:id/payment', authenticate, requireRole('staff', 'admin'), async (req, res, next) => {
  try {
    const order = await orderService.markPaid(req.params.id);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

export default router;
