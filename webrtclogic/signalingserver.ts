const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const SERVER_IP = '192.168.6.10'; 
const LAPTOP_IP = '192.168.178.73';

const io = new Server(server, {
    cors: {
origin: [
            'http://localhost:4200',
            'http://localhost:4201',
            'http://localhost:81',
            `http://${SERVER_IP}:80`,
            `http://${SERVER_IP}:81`,
            `http://${SERVER_IP}:3000`,
            `http://${LAPTOP_IP}:4200`,
            `http://${LAPTOP_IP}:4201`,
            `http://${LAPTOP_IP}:81` 
        ],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const registry = new Map();

io.on('connection', (socket) => {
  console.log('Client verbunden:', socket.id);

  socket.on('register', (userId) => {
    console.log(`Registrierung: ${userId} -> ${socket.id}`);
    registry.set(userId, socket.id);
    socket.data.userId = userId;
  });

  socket.on('call-request', (payload) => {
    const targetSocketId = registry.get(payload.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('incoming-call', { from: payload.from, metadata: payload.metadata });
      console.log(`Anrufanfrage von ${payload.from} an ${payload.to}`);
    } else {
      io.to(socket.id).emit('call-failed', { reason: 'target-unreachable' });
      console.log(`Anruf fehlgeschlagen: Ziel ${payload.to} nicht erreichbar`);
    }
  });

  socket.on('call-offer', (payload) => {
    const target = registry.get(payload.to);
    if (target) io.to(target).emit('call-offer', { from: payload.from, sdp: payload.sdp });
  });

  socket.on('call-answer', (payload) => {
    const target = registry.get(payload.to);
    if (target) io.to(target).emit('call-answer', { from: payload.from, sdp: payload.sdp });
  });

  socket.on('ice-candidate', (payload) => {
    const target = registry.get(payload.to);
    if (target) io.to(target).emit('ice-candidate', { from: payload.from, candidate: payload.candidate });
  });

  socket.on('call-rejected', (payload) => {
    const target = registry.get(payload.to);
    if (target) io.to(target).emit('call-rejected', { from: payload.from, reason: payload.reason });
  });

  socket.on('call-end', (payload) => {
    const target = registry.get(payload.to);
    if (target) io.to(target).emit('call-end', { from: payload.from, reason: payload.reason });
  });

  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    if (userId) {
      registry.delete(userId);
      console.log(`User ${userId} getrennt`);
    } else {
      console.log(`Socket ${socket.id} getrennt`);
    }
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Signaling server läuft auf:`);
    console.log(`- Local:   http://localhost:${PORT}`);
    console.log(`- Network: http://${SERVER_IP}:${PORT}`);
});
