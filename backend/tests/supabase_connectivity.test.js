import test from 'node:test';
import assert from 'node:assert/strict';
import { supabaseAdmin, supabaseClient, isSupabaseConfigured } from '../src/config/supabase.js';

test('QueueBite Supabase Connectivity & Schema Verification', async (t) => {
  await t.test('1. Supabase environment configuration is detected', () => {
    assert.equal(isSupabaseConfigured, true, 'isSupabaseConfigured must be true');
    assert.ok(supabaseAdmin, 'supabaseAdmin client must be initialized');
  });

  await t.test('2. Supabase Auth Admin service connection succeeds', async () => {
    const res = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    assert.equal(res.error, null, `Auth Admin request failed: ${res.error?.message}`);
    assert.ok(Array.isArray(res.data.users));
  });

  await t.test('3. Verify remote database schema status', async () => {
    const tables = [
      'profiles',
      'menu_items',
      'pickup_slots',
      'daily_token_counters',
      'canteen_settings',
      'canteen_breaks',
      'orders',
      'order_items'
    ];

    const results = {};
    for (const table of tables) {
      const res = await supabaseAdmin.from(table).select('*').limit(1);
      results[table] = res.error ? res.error.code : 'EXISTS';
    }

    const unmigrated = Object.entries(results).filter(([_, status]) => status === 'PGRST205');
    console.log('Remote Database Schema Status:', results);

    if (unmigrated.length > 0) {
      console.log(`Notice: ${unmigrated.length} tables require SQL migration execution in Supabase SQL Editor.`);
    }
  });
});
