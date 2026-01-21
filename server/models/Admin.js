import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    totpSecret: {
        type: Object, // Stores speakeasy secret object
        default: null
    },
    isTotpEnabled: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: true
    }
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
