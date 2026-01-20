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
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;
