import { memoryStore } from '../services/store.js';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // 1. Supabase validation if configured
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      // a. Real Supabase auth JWT
      if (token.startsWith('ey') || token.length > 50) {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && user) {
          let { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (!profile) {
            profile = {
              id: user.id,
              role: user.user_metadata?.role || 'student',
              name: user.user_metadata?.name || user.email || 'User',
              college_id: user.user_metadata?.college_id || 'COLLEGE-ID'
            };
          }

          req.user = profile;
          return next();
        }
      }

      // b. Supabase profile UUID token
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
      if (isUuid) {
        const { data: dbProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', token)
          .maybeSingle();

        if (dbProfile) {
          req.user = dbProfile;
          return next();
        }
      }
    } catch (err) {
      // Fallback in non-production
    }
  }

  // 2. Demo tokens & memory store (allowed in development and test environments only)
  if (process.env.NODE_ENV !== 'production') {
    if (token === 'demo-admin-token' || token === 'admin') {
      req.user = {
        id: '3dc3abd6-91a7-4221-80b8-7838318ba67c',
        role: 'admin',
        name: 'Campus Admin'
      };
      return next();
    }
    if (token === 'demo-staff-token' || token === 'staff') {
      req.user = {
        id: '4203ec5a-4f3e-49e3-a8c1-3f8876ec0062',
        role: 'staff',
        name: 'Kitchen Staff'
      };
      return next();
    }
    if (token === 'demo-student-token' || token === 'student') {
      req.user = memoryStore.profiles.get('student-uuid-001') || {
        id: '17dcd054-ebaf-4919-a81c-ac0bc5aa0569',
        role: 'student',
        name: 'Demo Student'
      };
      return next();
    }

    if (memoryStore.profiles.has(token)) {
      req.user = memoryStore.profiles.get(token);
      return next();
    }
  }

  return res.status(401).json({ message: 'Invalid or expired authentication credentials' });
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: role '${req.user.role}' is not authorized. Required: ${allowedRoles.join(', ')}` 
      });
    }
    next();
  };
}
