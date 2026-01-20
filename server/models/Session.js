import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    ip: {
        type: String,
        required: true
    },
    fingerprintId: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    deviceName: {
        type: String,
        default: 'Unknown Device'
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
