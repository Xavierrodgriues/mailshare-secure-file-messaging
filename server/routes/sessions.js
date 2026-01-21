import express from 'express';
import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';
import { authenticateAdmin } from '../utils/auth.js';

const router = express.Router();


// GET all active sessions
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const sessions = await Session.find({ isActive: true }).sort({ lastSeen: -1 });
        res.json(sessions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE/INVALIDATE a session (Secure logout)
router.post('/logout-device', authenticateAdmin, async (req, res) => {
    const { sessionId } = req.body;
    console.log('[DEBUG] Logout Device request:', { sessionId });

    try {
        await Session.findByIdAndUpdate(sessionId, { isActive: false });

        // Notify clients about the session update
        req.app.get('io').emit('session_update', { type: 'logout', sessionId });

        res.json({ success: true, message: 'Device logged out' });
    } catch (err) {
        console.error('[DEBUG] Logout Device Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
