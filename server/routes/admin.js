// routes/admin.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import Log from '../models/Log.js';
import { authenticateAdmin } from '../utils/auth.js';

const router = express.Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


router.post('/delete-user', authenticateAdmin, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // 1. Delete auth user
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) throw authError;

    // 2. Delete profile
    const { error: profileError } =
      await supabaseAdmin.from('profiles').delete().eq('id', userId);

    if (profileError) throw profileError;

    // Log deletion
    const log = new Log({
      adminId: req.admin.id,
      email: req.admin.email,
      action: 'USER_DELETED',
      details: `Deleted user ID: ${userId}`,
      ip: req.ip
    });
    await log.save();
    req.app.get('io').emit('system_log', log);

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
