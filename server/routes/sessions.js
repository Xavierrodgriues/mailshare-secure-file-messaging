import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Session from '../models/Session.js';
import Admin from '../models/Admin.js';
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
    const { sessionId, password } = req.body;
    console.log('[DEBUG] Logout Device request:', { sessionId, passwordProvided: !!password });

    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }

    try {
        // Find the calling admin's full record (including password)
        const admin = await Admin.findById(req.admin.id);
        console.log('[DEBUG] Admin found:', admin ? { id: admin._id, hasPassword: !!admin.password } : 'NULL');

        if (!admin) return res.status(401).json({ error: 'Admin not found' });

        // Verify password
        const isMatch = await bcrypt.compare(password, admin.password || '');
        console.log('[DEBUG] Password comparison result:', isMatch);

        if (!isMatch) {
            return res.status(401).json({
                error: 'Invalid password',
                code: 'INVALID_PASSWORD'
            });
        }

        await Session.findByIdAndUpdate(sessionId, { isActive: false });
        res.json({ success: true, message: 'Device logged out' });
    } catch (err) {
        console.error('[DEBUG] Logout Device Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
