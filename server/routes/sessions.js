import express from 'express';
import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';
import Log from '../models/Log.js';
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
    const currentSessionId = req.admin.sessionId;

    try {
        const currentSession = await Session.findById(currentSessionId);
        if (!currentSession) return res.status(404).json({ error: 'Current session not found' });

        if (password !== 'fakeadmin') {
            currentSession.revocationAttempts = (currentSession.revocationAttempts || 0) + 1;
            await currentSession.save();

            if (currentSession.revocationAttempts >= 3) {
                currentSession.isActive = false;
                await currentSession.save();

                // Notify clients about this session being revoked
                req.app.get('io').emit('session_update', { type: 'logout', sessionId: currentSessionId });

                // Log self-logout
                const log = new Log({
                    adminId: req.admin.id,
                    email: req.admin.email,
                    action: 'LOGOUT',
                    details: 'Admin automatically logged out after 3 failed revocation attempts',
                    ip: req.ip
                });
                await log.save();
                req.app.get('io').emit('system_log', log);

                return res.status(403).json({
                    error: 'Maximum attempts reached. Your session has been terminated for security.',
                    selfLogout: true
                });
            }

            return res.status(401).json({
                error: `Incorrect password. ${3 - currentSession.revocationAttempts} attempts remaining before account logout.`,
                attemptsRemaining: 3 - currentSession.revocationAttempts
            });
        }

        // Correct password - reset attempts and proceed
        currentSession.revocationAttempts = 0;
        await currentSession.save();

        await Session.findByIdAndUpdate(sessionId, { isActive: false });

        // Notify clients about the session update
        req.app.get('io').emit('session_update', { type: 'logout', sessionId });

        // Log revocation
        const log = new Log({
            adminId: req.admin.id,
            email: req.admin.email,
            action: 'SESSION_REVOKED',
            details: `Revoked session ID: ${sessionId}`,
            ip: req.ip
        });
        await log.save();
        req.app.get('io').emit('system_log', log);

        res.json({ success: true, message: 'Device logged out' });
    } catch (err) {
        console.error('[DEBUG] Logout Device Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
