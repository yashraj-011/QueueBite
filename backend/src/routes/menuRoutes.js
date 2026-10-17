import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { menuService } from '../services/menuService.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

const router = Router();

// Multer: store file in memory (no disk), max 5 MB, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files (jpg, png, webp, gif) are allowed'));
  }
});

// Admin: POST /api/v1/menu/upload-image  — upload image, get back public URL
router.post(
  '/upload-image',
  authenticate,
  requireRole('admin'),
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      if (!isSupabaseConfigured || !supabaseAdmin) {
        return res.status(503).json({ message: 'Storage not configured' });
      }

      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const fileName = `menu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

      const { error } = await supabaseAdmin.storage
        .from('menu-images')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        return res.status(500).json({ message: `Upload failed: ${error.message}` });
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      res.json({ success: true, url: urlData.publicUrl });
    } catch (err) {
      next(err);
    }
  }
);

// Public: GET /api/v1/menu
router.get('/', async (req, res, next) => {
  try {
    const { category, search, dietary } = req.query;
    const items = await menuService.getMenu({ category, search, dietary, isVisible: true });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// Public: GET /api/v1/menu/categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await menuService.getCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// Admin: POST /api/v1/menu
router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const item = await menuService.createItem(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// Admin: PUT /api/v1/menu/:id
router.put('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const item = await menuService.updateItem(req.params.id, req.body);
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// Admin: PATCH /api/v1/menu/:id/availability
router.patch('/:id/availability', authenticate, requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const { is_available, available } = req.body;
    const val = is_available !== undefined ? is_available : available;
    const item = await menuService.updateItem(req.params.id, { is_available: val });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// Admin: PATCH /api/v1/menu/:id/stock
router.patch('/:id/stock', authenticate, requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const { stock } = req.body;
    const item = await menuService.updateItem(req.params.id, { stock });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// Admin: DELETE /api/v1/menu/:id
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const item = await menuService.deleteItem(req.params.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
});

export default router;
