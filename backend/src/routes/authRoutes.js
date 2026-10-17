import { Router } from 'express';
import { memoryStore } from '../services/store.js';
import { authenticate } from '../middleware/auth.js';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { role, username, password, rollNo, name, phone } = req.body;

    if (role === 'admin') {
      if ((username === 'admin' && password === 'admin123') || (username === 'admin' && !password)) {
        if (process.env.NODE_ENV === 'production' && !password) {
          return res.status(401).json({ message: 'Password required in production' });
        }
        let adminUser = {
          id: '3dc3abd6-91a7-4221-80b8-7838318ba67c',
          name: 'Campus Admin',
          role: 'admin',
          college_id: 'ADMIN-001'
        };
        if (isSupabaseConfigured && supabaseAdmin) {
          const { data } = await supabaseAdmin.from('profiles').select('*').eq('role', 'admin').maybeSingle();
          if (data) adminUser = data;
        }
        return res.json({
          success: true,
          token: adminUser.id,
          user: adminUser
        });
      }
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    if (role === 'staff') {
      if (password === 'staff123' || username === 'staff') {
        if (process.env.NODE_ENV === 'production' && password !== 'staff123') {
          return res.status(401).json({ message: 'Password required in production' });
        }
        let staffUser = {
          id: '4203ec5a-4f3e-49e3-a8c1-3f8876ec0062',
          name: 'Kitchen Staff',
          role: 'staff',
          college_id: 'STAFF-001'
        };
        if (isSupabaseConfigured && supabaseAdmin) {
          const { data } = await supabaseAdmin.from('profiles').select('*').eq('role', 'staff').maybeSingle();
          if (data) staffUser = data;
        }
        return res.json({
          success: true,
          token: staffUser.id,
          user: staffUser
        });
      }
      return res.status(401).json({ message: 'Invalid staff credentials' });
    }

    // Student Login / Registration
    const studentRoll = (rollNo || username || 'IT-101').toUpperCase().trim();
    const studentName = name || 'Student';

    // 1. If Supabase is configured, check or create in profiles table
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let { data: dbProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('college_id', studentRoll)
          .maybeSingle();

        if (!dbProfile) {
          const email = `${studentRoll.toLowerCase().replace(/[^a-z0-9]/g, '_')}@college.edu`;
          const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { name: studentName, college_id: studentRoll, role: 'student' }
          });
          const userId = authUser?.user?.id;
          if (userId) {
            const { data: newProfile } = await supabaseAdmin
              .from('profiles')
              .insert({
                id: userId,
                name: studentName,
                college_id: studentRoll,
                phone: phone || '',
                role: 'student'
              })
              .select()
              .single();
            dbProfile = newProfile;
          }
        }

        if (dbProfile) {
          return res.json({
            success: true,
            token: dbProfile.id,
            user: dbProfile
          });
        }
      } catch (err) {
        // Fallback in dev/test if error
      }
    }

    // 2. Memory store fallback
    let existing = Array.from(memoryStore.profiles.values()).find(
      p => p.role === 'student' && p.college_id.toUpperCase() === studentRoll
    );

    if (!existing) {
      const newId = `student-${Date.now()}`;
      existing = {
        id: newId,
        name: studentName,
        college_id: studentRoll,
        phone: phone || '',
        role: 'student',
        created_at: new Date().toISOString()
      };
      memoryStore.profiles.set(newId, existing);
    }

    return res.json({
      success: true,
      token: existing.id,
      user: existing
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/session
router.get('/session', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
