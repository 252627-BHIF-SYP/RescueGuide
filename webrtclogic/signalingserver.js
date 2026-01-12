const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Simple registry: userId -> socket.id
const registry = new Map();

io.on('connection', (socket) => {
  console.log('Client connected', socket.id);

  socket.on('register', (userId) => {
    console.log(`Register ${userId} -> ${socket.id}`);
    registry.set(userId, socket.id);
    socket.data = socket.data || {};
    socket.data.userId = userId;
  });

  socket.on('call-request', (payload) => {
    const targetSocketId = registry.get(payload.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('incoming-call', { from: payload.from, metadata: payload.metadata });
      console.log(`Call request from ${payload.from} to ${payload.to}`);
    } else {
      io.to(socket.id).emit('call-failed', { reason: 'target-unreachable' });
      console.log(`Call failed: target ${payload.to} unreachable`);
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
    const userId = socket.data && socket.data.userId;
    if (userId) {
      registry.delete(userId);
      console.log(`User ${userId} disconnected`);
    } else {
      console.log(`Socket ${socket.id} disconnected`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Signaling server listening on ${PORT}`));

