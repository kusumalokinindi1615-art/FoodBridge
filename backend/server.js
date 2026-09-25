require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

/* ─── Socket.IO (real-time notifications) ────────────── */
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  // Frontend emits 'join' with its user id after login
  socket.on('join', (userId) => {
    if (userId) socket.join(`user:${userId}`);
  });
  socket.on('disconnect', () => {});
});

app.set('io', io);

/* ─── Middleware ─────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ─── Routes ─────────────────────────────────────────── */
app.get('/', (req, res) => res.send('FoodBridge API is running'));
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'API is healthy' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/stats', require('./routes/stats'));

/* ─── 404 + error handler ────────────────────────────── */
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

/* ─── DB + start ─────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI missing in backend/.env — get a free cluster at mongodb.com/atlas');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const { startExpiryJob } = require('./jobs/expiryJob');
    startExpiryJob(io);
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
