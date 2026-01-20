import express from 'express';
import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';

const router = express.Router();

// Middleware to authenticate admin
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.admin = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

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

// DELETE/INVALIDATE a session
router.post('/logout-device', authenticateAdmin, async (req, res) => {
    const { sessionId } = req.body;
    try {
        await Session.findByIdAndUpdate(sessionId, { isActive: false });
        res.json({ success: true, message: 'Device logged out' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
