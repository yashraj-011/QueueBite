import { Router } from 'express';
import { slotService } from '../services/slotService.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/slots?date=YYYY-MM-DD
router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query;
    const slots = await slotService.getSlots(date);
    res.json(slots);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/slots/available?date=YYYY-MM-DD
router.get('/available', async (req, res, next) => {
  try {
    const { date } = req.query;
    const slots = await slotService.getAvailableSlots(date);
    res.json(slots);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/slots/settings
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await slotService.getSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// Admin: POST /api/v1/slots/settings
router.post('/settings', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const settings = await slotService.updateSettings(req.body);
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// Admin: PATCH /api/v1/slots/:id/capacity
router.patch('/:id/capacity', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const slot = await slotService.updateCapacity(req.params.id, req.body.capacity || req.body.maxOrders);
    res.json(slot);
  } catch (err) {
    next(err);
  }
});

// Admin: PATCH /api/v1/slots/:id/block
router.patch('/:id/block', authenticate, requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const slot = await slotService.toggleBlock(req.params.id, req.body.blocked);
    res.json(slot);
  } catch (err) {
    next(err);
  }
});

// Admin: POST /api/v1/slots/bulk-block
router.post('/bulk-block', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await slotService.bulkBlock(req.body.date);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Admin: POST /api/v1/slots/bulk-unblock
router.post('/bulk-unblock', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await slotService.bulkUnblock(req.body.date);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
