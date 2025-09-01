const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new socketIo.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 3000;

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('createRoom', () => {
        const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        socket.join(roomId);
        console.log(`Game screen ${socket.id} created and joined room ${roomId}`);
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', (roomId) => {
        if (io.sockets.adapter.rooms.has(roomId)) {
            socket.join(roomId);
            console.log(`Controller ${socket.id} joined room ${roomId}`);
            socket.emit('joinSuccess', roomId);
            io.to(roomId).emit('controllerConnected');
        } else {
            socket.emit('joinError', 'Room not found.');
        }
    });
    
    socket.on('controllerCommand', (data) => {
        io.to(data.roomId).emit('command', data.command);
    });
    
    socket.on('gameUpdate', (data) => {
        io.to(data.roomId).emit('update', data);
    });
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});