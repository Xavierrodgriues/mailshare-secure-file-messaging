import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    adminId: {
        type: String,
        required: true
    },
    adminEmail: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Broadcast', broadcastSchema);
