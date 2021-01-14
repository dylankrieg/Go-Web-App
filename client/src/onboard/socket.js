import { io } from 'socket.io-client';

const url="http://localhost:8000"

const Socket=io(url);

var mySocketId;

Socket.on("serverCreatedGame",gameInfo => {
    console.log('A new game has been created');
    mySocketId=gameInfo.socketId;
});

Socket.on("newUserLogin",whatever => {
    console.log('A new user has joined');
    //newUserEntered=true;
});



function listenForNewPlayer(cb) {
    Socket.on("changeScreens",() => {
        console.log("a change room signal has been received");
        //newUserEntered=true;
        cb();
    });
}
/*
function listenForScreenChange(cb) {
    Socket.on("changeScreens" , (cb) => {
        console.log("a change room message has been received");
        cb();
        console.log("a change room message has been received");
        newUserEntered=true;
    })
}
*/

export { Socket }
export { mySocketId }
export { listenForNewPlayer }
