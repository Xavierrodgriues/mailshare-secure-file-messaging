import express from 'express';
import Log from '../models/Log.js';
import { authenticateAdmin } from '../utils/auth.js';

const router = express.Router();

// GET recent logs
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
