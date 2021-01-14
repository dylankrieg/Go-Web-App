const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});
const gameLogic=require('./game-logic.js')

io.on('connection', (socket) => {
    console.log('Client connected\n');
    gameLogic.initializeGame(io,socket); 
});

server.listen(8000, () => {
  console.log('listening on port 8000\n');
});
