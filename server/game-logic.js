let io;
let gameSocket;

function initializeGame(sio,socket) {
    io=sio;
    gameSocket=socket;

    gameSocket.on('createNewGame',createNewGame);
    
    gameSocket.on('new move',newMove);
}

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

function createNewGame(newGameId) {
    console.log('new game created\n');
    gameSocket.emit('serverCreatedGame',{gameId:newGameId,socketId:gameSocket.id});

    gameSocket.join(newGameId);
    readline.question("Enter any text to change screens\n", () => {
        readline.close();
        gameSocket.emit("changeScreens");
        console.log("I sent a message to your friend\n")
    })
}

function newMove(newMove) {
    console.log(newMove);
}


module.exports={initializeGame}