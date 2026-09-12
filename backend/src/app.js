// app.js
const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');

// ✅ Import all routes
const authRoutes = require('./routes/auth.route');
const problemRoutes = require('./routes/problem.route');
const projectRoutes = require('./routes/project.route');
const internalRoutes = require('./routes/internal.route');
const notificationRoutes = require('./routes/notification.route');
const userRoutes = require('./routes/user.route'); // additive — see controllers/user.controller.js

// ✅ Import error handler (optional but recommended)
const { errorHandler } = require('./middleware/errorHandler.middleware');

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

// ✅ Mount all routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/internal', internalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Health check (optional)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route ${req.method} ${req.url} not found` 
  });
});

// ✅ Global error handler (catches all errors from controllers)
app.use(errorHandler);

module.exports = app;