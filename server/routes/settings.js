import express from 'express';
import jwt from 'jsonwebtoken';
import SystemSettings from '../models/SystemSettings.js';

const router = express.Router();

// Auth middleware to verify admin token
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

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
        console.log('Settings successfully saved to MongoDB:', settings);
        res.json(settings);
    } catch (err) {
        console.error('Error updating settings in MongoDB:', err);
        res.status(500).json({ error: 'Error updating settings' });
    }
});


export default router;
