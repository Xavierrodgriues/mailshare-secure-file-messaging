import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';

dotenv.config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing admins
        await Admin.deleteMany({});
        console.log('Cleared existing admins.');

        // Seed new single admin
        const singleAdmin = new Admin({
            email: 'yuviiconsultancy@gmail.com',
            isTotpEnabled: false,
            totpSecret: null
        });

        await singleAdmin.save();
        console.log('Successfully seeded admin: yuviiconsultancy@gmail.com');

        process.exit(0);
    } catch (err) {
        console.error('Error seeding admin:', err);
        process.exit(1);
    }
}

seed();
