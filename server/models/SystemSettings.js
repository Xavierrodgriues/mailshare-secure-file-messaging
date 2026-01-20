import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
    maintenanceMode: {
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
