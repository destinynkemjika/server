const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://solreach.net", // Replace with your Netlify URL
    methods: ["GET", "POST"],
  },
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinChat', (matchId) => {
    socket.join(matchId);
    console.log(`User ${socket.id} joined chat ${matchId}`);
  });

  socket.on('sendMessage', async ({ matchId, senderId, receiverId, message }) => {
    console.log(`Message received: ${message} for match ${matchId}`);
    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: senderId,
      message: message,
      timestamp: new Date().toISOString(),
    });
    if (error) {
      console.error('Error saving message:', error);
      socket.emit('error', 'Failed to save message');
      return;
    }
    io.to(matchId).emit('receiveMessage', {
      senderId,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is listening on port ${PORT}`);
});