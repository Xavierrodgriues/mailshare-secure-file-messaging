import express from 'express';
import jwt from 'jsonwebtoken';
import SystemSettings from '../models/SystemSettings.js';
import Log from '../models/Log.js';
import { authenticateAdmin } from '../utils/auth.js';

const router = express.Router();


// GET public settings (e.g. maintenance mode status)
router.get('/public', async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({
                maintenanceMode: false,
                locale: 'en-us',
                timezone: 'utc',
                domainWhitelistEnabled: true
            });
        }
        res.json({
            maintenanceMode: settings.maintenanceMode,
            locale: settings.locale,
            timezone: settings.timezone,
            domainWhitelistEnabled: settings.domainWhitelistEnabled
        });
    } catch (err) {
        console.error('Error in /public settings:', err);
        res.status(500).json({ error: 'Error fetching public settings' });
    }
});

// GET all settings (Admin only)
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({
                maintenanceMode: false,
                locale: 'en-us',
                timezone: 'utc',
                domainWhitelistEnabled: true
            });
        }
        res.json(settings);
    } catch (err) {
        console.error('Error in GET / settings:', err);
        res.status(500).json({ error: 'Error fetching settings' });
    }
});

// UPDATE settings (Admin only)
router.post('/', authenticateAdmin, async (req, res) => {
    const { maintenanceMode, locale, timezone, domainWhitelistEnabled } = req.body;
    console.log('Received settings update request:', req.body);
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = new SystemSettings({ maintenanceMode, locale, timezone, domainWhitelistEnabled });
        } else {
            if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
            if (locale !== undefined) settings.locale = locale;
            if (timezone !== undefined) settings.timezone = timezone;
            if (domainWhitelistEnabled !== undefined) settings.domainWhitelistEnabled = domainWhitelistEnabled;
            settings.updatedAt = Date.now();
        }
        await settings.save();

        // Log settings update
        const log = new Log({
            adminId: req.admin.id,
            email: req.admin.email,
            action: 'SETTINGS_CHANGED',
            details: `Updated system settings: ${Object.keys(req.body).join(', ')}`,
            ip: req.ip
        });
        await log.save();
        req.app.get('io').emit('system_log', log);

        console.log('Settings successfully saved to MongoDB:', settings);
        res.json(settings);
    } catch (err) {
        console.error('Error updating settings in MongoDB:', err);
        res.status(500).json({ error: 'Error updating settings' });
    }
});


export default router;
