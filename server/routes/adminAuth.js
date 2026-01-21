import express from 'express';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Session from '../models/Session.js';
import { UAParser } from 'ua-parser-js';

const router = express.Router();

// 1. Init: Check if admin exists and their TOTP status
router.post('/init', async (req, res) => {
    const { email } = req.body;

    try {
        const adminCount = await Admin.countDocuments();
        let admin = await Admin.findOne({ email });

        if (!admin) {
            // If an admin already exists, don't allow another one to be created via this flow
            if (adminCount > 0) {
                return res.status(403).json({
                    status: 'forbidden',
                    message: 'Admin already registered. Access denied for new emails.'
                });
            }

            // Create the first admin if none exist
            admin = new Admin({ email });
            await admin.save();
            return res.json({ status: 'setup_needed', message: 'First admin created. Setup TOTP.' });
        }

        if (admin.isTotpEnabled) {
            return res.json({ status: 'verify_needed', message: 'TOTP enabled. Enter code.' });
        } else {
            return res.json({ status: 'setup_needed', message: 'TOTP not yet enabled. Setup TOTP.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. Setup: Generate Secret and QR Code
router.post('/setup', async (req, res) => {
    const { email } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `MailShare (${email})`
        });

        // Save secret temporarily (or permanently but disabled)
        admin.totpSecret = secret;
        await admin.save();

        // Generate QR Code
        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) return res.status(500).json({ error: 'Error generating QR code' });

            res.json({
                secret: secret.base32,
                qrCode: data_url
            });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. Verify: Verify TOTP token and login
router.post('/verify', async (req, res) => {
    const { email, token } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        if (!admin.totpSecret) return res.status(400).json({ error: 'TOTP not set up' });

        const verified = speakeasy.totp.verify({
            secret: admin.totpSecret.base32,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            // Enable TOTP if it was just a setup verification
            if (!admin.isTotpEnabled) {
                admin.isTotpEnabled = true;
                await admin.save();
            }

            // Record Session
            const parser = new UAParser(req.headers['user-agent']);
            const result = parser.getResult();
            const deviceName = `${result.os.name || ''} ${result.browser.name || ''}`.trim() || 'Unknown Device';

            const xForwardedFor = req.headers['x-forwarded-for'];
            const clientIp = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.socket.remoteAddress;
            const normalizedIp = clientIp.replace('::ffff:', '');

            const { fingerprintId } = req.body;

            const session = await Session.findOneAndUpdate(
                { adminId: admin._id, fingerprintId: fingerprintId || normalizedIp },
                {
                    email: admin.email,
                    deviceName,
                    ip: normalizedIp,
                    userAgent: req.headers['user-agent'],
                    lastSeen: Date.now(),
                    isActive: true
                },
                { upsert: true, new: true }
            );

            // Return success with a JWT token
            const token = jwt.sign(
                { email: admin.email, id: admin._id, sessionId: session._id },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '1h' }
            );

            // Notify clients about the session update
            req.app.get('io').emit('session_update', { type: 'login', email: admin.email });

            return res.json({
                status: 'success',
                message: 'Authentication successful',
                token: token
            });
        } else {
            return res.status(400).json({ status: 'failed', error: 'Invalid TOTP token' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 4. Protected Route Example
router.get('/dashboard-data', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        res.json({ message: `Welcome ${decoded.email}, here is your protected data.` });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;
