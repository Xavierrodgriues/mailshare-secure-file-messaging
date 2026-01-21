import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateAdmin } from '../utils/auth.js';
import Log from '../models/Log.js';

const router = express.Router();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET storage stats
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        // 1. Fetch file attachments from Supabase (Proxy for R2 usage)
        const { data: attachments, error } = await supabaseAdmin
            .from('attachments')
            .select('file_size');

        if (error) throw error;

        const userFilesBytes = attachments.reduce((sum, item) => sum + (item.file_size || 0), 0);
        const fileCount = attachments.length;

        // 2. Estimate System Log size (approximate)
        const logCount = await Log.countDocuments();
        const logsBytes = logCount * 500; // Estimated 500 bytes per log entry

        // 3. Estimate System Metadata/Backups
        const systemBytes = 15 * 1024 * 1024; // Static 15MB for system overhead

        const totalBytes = userFilesBytes + logsBytes + systemBytes;

        // System quota (Cloudflare R2 Free Tier is 10GB)
        const QUOTA_LIMIT = 10 * 1024 * 1024 * 1024;

        res.json({
            totalBytes,
            fileCount,
            bucketName: 'mailshare-secure-attachments',
            quotaLimit: QUOTA_LIMIT,
            percentageUsed: (totalBytes / QUOTA_LIMIT) * 100,
            lastUpdated: new Date().toISOString(),
            breakdown: [
                { name: 'User Files', bytes: userFilesBytes, color: 'bg-primary' },
                { name: 'System Logs', bytes: logsBytes, color: 'bg-sky-400' },
                { name: 'Core Data', bytes: systemBytes, color: 'bg-indigo-300' }
            ],
            status: (totalBytes / QUOTA_LIMIT) > 0.8 ? 'warning' : 'healthy'
        });
    } catch (err) {
        console.error('Storage Stats Error:', err);
        res.status(500).json({ error: 'Failed to fetch storage statistics' });
    }
});

export default router;
