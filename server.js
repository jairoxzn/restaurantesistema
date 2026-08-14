const express = require('express');
const cors = require('cors');
const http = require('http');
const socketConfig = require('./socket');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/caja', require('./routes/caja'));
app.use('/api/kardex', require('./routes/kardex'));
app.use('/api/kds', require('./routes/kds'));
app.use('/api/mesas', require('./routes/mesas'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cafetería Colca API is running' });
});

// --- Serve Frontend (production build) ---
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback: any non-API route serves index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message && err.message.includes('Solo se permiten imágenes')) {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const io = socketConfig.init(server);

io.on('connection', (socket) => {
  console.log('KDS Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('KDS Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Cafetería Colca running on http://localhost:${PORT}`);
});
