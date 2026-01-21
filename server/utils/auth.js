import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';
import SystemSettings from '../models/SystemSettings.js';
import Log from '../models/Log.js';

export const authenticateAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // Strictly require sessionId for all tokens
        if (!decoded.sessionId) {
            return res.status(401).json({ error: 'Legacy session. Please re-login.' });
        }

        const session = await Session.findById(decoded.sessionId);
        if (!session || !session.isActive) {
            return res.status(401).json({ error: 'Session has been revoked or is invalid' });
        }

        // Inactivity Timeout Check
        const settings = await SystemSettings.findOne();
        const lastSeen = new Date(session.lastSeen).getTime();
        const now = Date.now();
        const inactivityDuration = (now - lastSeen) / 1000; // in seconds

        const timeoutThreshold = settings && settings.shortSessionTimeout ? 86400 : 2592000; // 24 hours (if on) or 30 days (default)

        if (inactivityDuration > timeoutThreshold) {
            session.isActive = false;
            await session.save();

            // Notify clients and log
            const timeoutType = settings && settings.shortSessionTimeout ? '24-hour inactivity' : 'extended inactivity';

            const log = new Log({
                adminId: decoded.id,
                email: decoded.email,
                action: 'LOGOUT',
                details: `Session automatically invalidated due to ${timeoutType}`,
                ip: req.ip
            });
            await log.save();

            const io = req.app.get('io');
            if (io) {
                io.emit('session_update', { type: 'logout', sessionId: session._id, reason: 'timeout' });
                io.emit('system_log', log);
            }

            return res.status(401).json({ error: 'Session expired due to inactivity' });
        }

        // Update lastSeen for active sessions (skip for background polls)
        if (req.headers['x-background-poll'] !== 'true') {
            session.lastSeen = now;
            await session.save();
        }

        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
