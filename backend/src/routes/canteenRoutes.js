import { Router } from 'express';
import { memoryStore } from '../services/store.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

const router = Router();

// GET /api/v1/canteen/status
router.get('/status', async (req, res, next) => {
  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: settings, error } = await supabaseAdmin
        .from('canteen_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (!error && settings) {
        return res.json({
          open: settings.canteen_open,
          settings
        });
      }
    }

    res.json({
      open: memoryStore.settings.canteen_open,
      settings: memoryStore.settings
    });
  } catch (err) {
    next(err);
  }
});

// Admin: POST /api/v1/canteen/status
router.post('/status', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { open } = req.body;
    const isOpen = open !== undefined ? Boolean(open) : true;

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: settings, error } = await supabaseAdmin
        .from('canteen_settings')
        .update({ canteen_open: isOpen })
        .eq('id', 1)
        .select()
        .maybeSingle();

      if (!error && settings) {
        memoryStore.settings.canteen_open = settings.canteen_open;
        return res.json({
          success: true,
          open: settings.canteen_open
        });
      }
    }

    memoryStore.settings.canteen_open = isOpen;
    res.json({
      success: true,
      open: memoryStore.settings.canteen_open
    });
  } catch (err) {
    next(err);
  }
});

export default router;
