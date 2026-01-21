import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
    adminId: {
        type: String, // String to support both MongoDB and external IDs if needed
        required: true
    },
    email: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['LOGIN', 'LOGOUT', 'USER_DELETED', 'USER_REGISTERED', 'SESSION_REVOKED', 'SETTINGS_CHANGED', 'SYSTEM_ALERT']
    },
    details: {
        type: String,
        default: ''
    },
    ip: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        expires: 86400 // Automatically delete after 24 hours (86400 seconds)
    }
});

const Log = mongoose.model('Log', logSchema);
export default Log;
