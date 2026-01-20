import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';

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

        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
