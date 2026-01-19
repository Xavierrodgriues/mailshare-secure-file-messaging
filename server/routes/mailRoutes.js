import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const verifyService = (req, res, next) => {
  if (req.headers['x-internal-key'] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(401).json({ error: 'Unauthorized service' });
  }
  next();
};

/**
 * POST /api/internal-mail/send
 * AI → User message
 */
router.post('/send', verifyService, async (req, res) => {
  const { to_user_id, subject, body } = req.body;

  if (!to_user_id || !subject || !body) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabaseAdmin.from('messages').insert({
    from_user_id: process.env.AI_USER_ID, // 🤖 AI USER
    to_user_id,
    subject,
    body,
    is_read: false,
    is_deleted_sender: false,
    is_deleted_receiver: false
  });

  if (error) {
    console.error('Insert failed:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.json({ success: true });
});

export default router;
