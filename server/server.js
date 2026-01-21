import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store io in app to access it in routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

import adminAuthRoutes from './routes/adminAuth.js';
import adminRoutes from './routes/admin.js';
import mailRoutes from './routes/mailRoutes.js';
import settingsRoutes from './routes/settings.js';
import sessionsRoutes from './routes/sessions.js';

app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/sessions', sessionsRoutes);

// 👇 REGISTER INTERNAL MAIL API
app.use('/api/internal-mail', mailRoutes);


// Basic Route
app.get('/', (req, res) => {
    res.send('MailShare Server Running');
});

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('A client disconnected');
    });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
