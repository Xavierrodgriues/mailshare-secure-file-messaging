import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    locale: {
        type: String,
        default: 'en-us'
    },
    timezone: {
        type: String,
        default: 'utc'
    },
    domainWhitelistEnabled: {
        type: Boolean,
        default: true
    },
    shortSessionTimeout: {
        type: Boolean,
        default: false
    },
    shortSessionTimeout: {
        type: Boolean,
        default: false
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;
