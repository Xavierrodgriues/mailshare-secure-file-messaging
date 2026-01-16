import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';

dotenv.config();

async function reset() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await Admin.deleteMany({});
        console.log(`Successfully cleared ${result.deletedCount} admin(s).`);

        process.exit(0);
    } catch (err) {
        console.error('Error resetting DB:', err);
        process.exit(1);
    }
}

reset();
