const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const lawyerRoutes = require('./routes/lawyers');
const appointmentRoutes = require('./routes/appointments');
const feedbackRoutes = require('./routes/feedback');
const chatRoutes = require('./routes/chat'); // Ensure this includes /history/:userId endpoint
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');
const Appointment = require('./models/Appointment');

const app = express();
const server = http.createServer(app);

// CORS configuration for both HTTP and WebSockets
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const corsOptions = {
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
};

app.use(cors(corsOptions));

// Allow preflight requests explicitly
app.options('*', cors(corsOptions));

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
connectDB()
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
console.log('🚀 Registering routes...');
app.use('/api/auth', authRoutes);
console.log('✅ Registered /api/auth routes');
app.use('/api/lawyers', lawyerRoutes);
console.log('✅ Registered /api/lawyers routes');
app.use('/api/appointments', appointmentRoutes);
console.log('✅ Registered /api/appointments routes');
app.use('/api/feedback', feedbackRoutes);
console.log('✅ Registered /api/feedback routes');
app.use('/api/chat', chatRoutes); // Must include GET /chat/history/:userId
console.log('✅ Registered /api/chat routes');
app.use('/api/admin', adminRoutes);
console.log('✅ Registered /api/admin routes');

// Health check endpoint
app.get('/api/health', (req, res) => {
  let dbStatus = 'unknown';
  let dbError = null;
  try {
    switch (mongoose.connection.readyState) {
      case 0:
        dbStatus = 'disconnected';
        break;
      case 1:
        dbStatus = 'connected';
        break;
      case 2:
        dbStatus = 'connecting';
        break;
      case 3:
        dbStatus = 'disconnecting';
        break;
    }
  } catch (err) {
    dbStatus = 'error';
    dbError = err.message;
  }
  res.json({
    status: 'ok',
    db: dbStatus,
    dbError,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Initialize Socket.IO with same CORS options
const io = socketIo(server, { cors: corsOptions });

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-consultation', async (consultationId) => {
    socket.join(consultationId);
    console.log(`User ${socket.id} joined consultation ${consultationId}`);
    // Set startTime if not set
    try {
      const appointment = await Appointment.findById(consultationId);
      if (appointment && !appointment.startTime) {
        appointment.startTime = new Date();
        await appointment.save();
      }
    } catch (err) {
      console.error('Error setting video call startTime:', err);
    }
    socket.to(consultationId).emit('user-joined', {
      id: socket.id,
      name: 'Participant',
      timestamp: new Date(),
    });
  });

  socket.on('user-joined', (data) => {
    socket.to(data.consultationId).emit('user-joined', {
      id: socket.id,
      name: data.name || 'Participant',
      role: data.role,
      timestamp: new Date(),
    });
  });

  socket.on('offer', (data) => {
    console.log(`Offer from ${socket.id} to consultation ${data.consultationId}`);
    socket.to(data.consultationId).emit('offer', {
      offer: data.offer,
      from: socket.id,
      timestamp: new Date(),
    });
  });

  socket.on('answer', (data) => {
    console.log(`Answer from ${socket.id} to consultation ${data.consultationId}`);
    socket.to(data.consultationId).emit('answer', {
      answer: data.answer,
      from: socket.id,
      timestamp: new Date(),
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.consultationId).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id,
      timestamp: new Date(),
    });
  });

  socket.on('chat-message', (data) => {
    socket.to(data.consultationId).emit('chat-message', {
      message: data.message,
      from: socket.id,
      timestamp: new Date(),
    });
  });

  socket.on('typing', (data) => {
    if (data.conversationId) {
      socket.to(data.conversationId).emit('typing', {
        from: data.from,
        to: data.to,
        conversationId: data.conversationId,
      });
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    // For each room, check if it's now empty and set endTime
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit('user-left', {
          id: socket.id,
          timestamp: new Date(),
        });
        // Check if room is now empty
        const roomSockets = await io.in(room).allSockets();
        if (roomSockets.size === 0) {
          try {
            const appointment = await Appointment.findById(room);
            if (appointment && !appointment.endTime) {
              appointment.endTime = new Date();
              await appointment.save();
            }
          } catch (err) {
            console.error('Error setting video call endTime:', err);
          }
        }
      }
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start the server on localhost only
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '127.0.0.1';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
});

module.exports = { app, io };