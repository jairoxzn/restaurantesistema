const http = require('http');
const app = require('./app');
const socketConfig = require('./socket');

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
