import React from 'react';

function Tile(props)  {
    const {width,height}=useWindowSize();
    const minDim=width<height ? width:height;
    const tileSize=((0.9*minDim)/9)
    const radius=(props.stoneRadius>0 ? ((tileSize/3)):0);
    const prevRadius=radius===0 ? (tileSize/3):0;
    const blackRadius=(props.currentPlayer==='b') ? prevRadius:0;
    const whiteRadius=(props.currentPlayer==='w') ? prevRadius:0;
    return (
      <button className="tile" onClick={props.onClick} onMouseEnter={props.onMouseEnter} onMouseLeave={props.mouseExit}>
        <svg width={tileSize} height={tileSize}>
          <circle  r={radius} cx={tileSize/2} cy={tileSize/2} stroke="black" strokeWidth="3" fill={props.stoneFill} />
          {props.isGameOver ? null:<circle className="black-circ" r={blackRadius} cx={tileSize/2} cy={tileSize/2} stroke="black" strokeWidth="3" />}
          {props.isGameOver ? null:<circle className="white-circ" r={whiteRadius} cx={tileSize/2} cy={tileSize/2} stroke="black" strokeWidth="3" />}
        </svg>
      </button>
      );
      
}


//store in utils/useWindowSize
//import useWindowSize from "../utils/useWindowSize"
function useWindowSize() {
  const isUndefined=typeof(window)=="undefined";
  const [windowSize,setWindowSize]=React.useState({
    width: isUndefined ? 1200:window.innerWidth,
    height:isUndefined ? 800:window.innerHeight,
  });

  React.useEffect(()=> {
    window.addEventListener("resize",()=> {
      setWindowSize({width:window.innerWidth,height:window.innerHeight});
    });
    return () => {
      window.removeEventListener("resize",() => {
        setWindowSize({width:window.innerWidth,height:window.innerHeight});
      });
    };
  },[]);
  return windowSize;
}



class Board extends React.Component {
  renderTile(row,col) {
    return (
      <Tile
      onClick={()=>this.props.onClick(row,col)}
      stoneRadius={this.props.board[row][col]!=='n' ? 14:0}
      stoneFill={this.props.board[row][col]==='b' ? 'black':'white'}
      currentPlayer={this.props.currentPlayer}
      isGameOver={this.props.isGameOver}
      />
    );
  }
  render() {
    const board=[];
    for(let row=0;row<this.props.boardSize;row++) {
      const boardRow=[];
      for(let col=0;col<this.props.boardSize;col++) {
        boardRow.push(this.renderTile(row,col));
      }
      board.push(<div className="board-row">{boardRow}</div>)
    }
    return (
      <div>
        {board}
      </div>
    );
  }
}

//Handles Game Logic
class Game extends React.Component {
  constructor(props) {
    super(props);
    this.boardSize=9;
    let Board=new Array(this.boardSize);
    for(let row=0;row<this.boardSize;row++) {
      Board[row]=new Array(this.boardSize);
    }
    for(let row=0;row<this.boardSize;row++) {
      for(let col=0;col<this.boardSize;col++) {
        Board[row][col]='n';
      }
    }
    this.state={
      isGameOver:false,
      player1Captures:0,
      player2Captures:0,
      currentPlayer:'b',
      board:Board,
      boardSize:this.boardSize,
      playerTurnStatus:"Black's Turn!",
      errorMessage:"",
      player1Name:'Player 1',
      player2Name:'Player 2',
      player1Color:'b',
      player2Color:'w',
      didPrevPlayerPass:false,
    };

    this.handlePass=this.handlePass.bind(this);
    this.handleResign=this.handleResign.bind(this);


  }


  isValidPos(row,col) {
    if(row>=0 && row<this.boardSize) {
      if(col>=0 && col<this.boardSize) {
        return true;
      }
    }
    return false;
  }
  
  //returns the number of liberties that a stone or group of connected stones has
  //expects the row and col of the stone or a row col in the group as input
  captureHelper(board,row,col,checkedNeighbors) {
    const playerColor=board[row][col]
    const directions=[[-1,0],[1,0],[0,1],[0,-1]];
    let numOfLiberties=0;
    let neighbors=[];
    const strRowCol=(row.toString())+"."+(col.toString());
    for(let i=0;i<directions.length;i++) {
      const direction=directions[i];
      const adjRow=row+direction[0];
      const adjCol=col+direction[1];
      
      if(this.isValidPos(adjRow,adjCol)) {
        const adjValue=board[adjRow][adjCol];
        const strAdjPos=(adjRow.toString())+"."+(adjCol.toString());
        if(adjValue==='n') {
          numOfLiberties+=1;
        }
        else if(adjValue===playerColor &&  !checkedNeighbors.has(strAdjPos)) {
          neighbors.push(strAdjPos);
        }
      }
    }

    if(numOfLiberties===0 && neighbors.length!==0) {
      checkedNeighbors.add(strRowCol);
      for(let i=0;i<neighbors.length;i++) {
        const neighbor=neighbors[i];
        const parsedNeighborPos=neighbor.split(".");
        const neighborRow=parseInt(parsedNeighborPos[0]);
        const neighborCol=parseInt(parsedNeighborPos[1]);
        numOfLiberties+=this.captureHelper(board,neighborRow,neighborCol,checkedNeighbors);
      }
      return numOfLiberties;
    }
    else if (numOfLiberties===0 && neighbors.length===0) {
      return 0;
    }
    else {
      return numOfLiberties;
    }
  }

  //Iterates through the board and checks if any of the opponents stones
  //have been captured
  //Returns a list of coordinates of captured stones
  getCapturedOpponents(board) {
    let capturedOpponents=[]
    const opponentColor=this.state.currentPlayer==='b' ? 'w':'b';
    for(let i=0;i<this.state.boardSize;i++) {
      for(let j=0;j<this.state.boardSize;j++) {
        const isEmpty=board[i][j]==='n';
        if(!isEmpty && board[i][j]===opponentColor) {
          const numberOfLiberties=this.captureHelper(board,i,j,new Set());
          if(numberOfLiberties===0) {
            capturedOpponents.push([i,j]);
          }
        }
      }
    }
    return capturedOpponents;
  }

  //run move procedure
  //returns error and new board
  runMoveProcedure(board,i,j) {
    let errorMessage="";
    let numCaptures=0;

    //if the tile is occupied
    if(board[i][j]!=='n') {
      errorMessage='Invalid Move!';
      return [board,numCaptures,errorMessage];
    }


    //places the current players stone at (i,j)
    board[i][j]=this.state.currentPlayer;
    

    //checks if any stones were captured
    const capturedOpponents=this.getCapturedOpponents(board);
    //if no stones were captured check the following 2 cases
    if(capturedOpponents.length===0) {
      //Finding out how many liberties the group at (i,j) has

      const numLiberties=this.captureHelper(board,i,j,new Set());

      //Case 1 (the stone or group placed has no liberties)
      if(numLiberties===0) {
        //Remove the current player's stone from (i,j)
        //And display invalid move message
        //should return error message of some kind
        board[i][j]='n'
        errorMessage="Invalid Move!"
        numCaptures=0;
        return [board,numCaptures,errorMessage];
      }

      //Case 2 (the stone or group placed has liberties)
      else {
        numCaptures=0;
        return [board,numCaptures,errorMessage];
      }
    }

    //If stones were captured
    else {

      //Check for illegal ko move
      if(capturedOpponents.length===1) {
      }


      numCaptures=capturedOpponents.length;

      //Remove the captured stones from the board
      for(let k=0;k<capturedOpponents.length;k++) {
        const capturedPos=capturedOpponents[k];
        const capturedRow=capturedPos[0];
        const capturedCol=capturedPos[1];
        board[capturedRow][capturedCol]="n"
      }
      return [board,numCaptures,errorMessage];
    }
  }



  makeMove(i,j) {

    const moveOutput=this.runMoveProcedure(this.state.board.slice(),i,j);
    const newBoard=moveOutput[0];
    const numStonesCaptured=moveOutput[1]
    const newErrorMessage=moveOutput[2];

    let newPlayer1Captures=this.state.player1Captures
    let newPlayer2Captures=this.state.player2Captures;
    let newPlayerTurnStatus=this.state.playerTurnStatus;
    let nextPlayer=this.state.currentPlayer;

    //The move was successful
    if(newErrorMessage==='') {
      nextPlayer=(this.state.currentPlayer==='b') ? 'w':'b';
      newPlayerTurnStatus=(nextPlayer==='b') ? "Black's Turn!":"White's Turn!";
    }
    //If stones were captured
    if(numStonesCaptured!==0) {
      if(this.state.currentPlayer===this.state.player1Color) {
        newPlayer1Captures+=numStonesCaptured;
      }
      else {
        newPlayer2Captures+=numStonesCaptured
      }
    }

    this.setState({
      board:newBoard,
      currentPlayer:nextPlayer,
      playerTurnStatus:newPlayerTurnStatus,
      errorMessage:newErrorMessage,
      player1Captures:newPlayer1Captures,
      player2Captures:newPlayer2Captures,
      didPrevPlayerPass:false,
    });
    
  }


  handleClick(i,j) {
    if(this.state.isGameOver===false) {
      this.makeMove(i,j);
    }
  }

  //Change player to next player 
  //If the next player passes then game scoring begins
  handlePass() {
    const nextPlayer=(this.state.currentPlayer==='b') ? 'w':'b';
    const newPlayerTurnStatus=(nextPlayer==='b') ? "Black's Turn!":"White's Turn!";

    //If the other player did not pass on their previous turn
    if(this.state.didPrevPlayerPass===false) {
      this.setState({
        currentPlayer:nextPlayer,
        playerTurnStatus:newPlayerTurnStatus,
        didPrevPlayerPass:true,
      });
    }
    //If the other player passed on their previous turn
    else {
      this.setState({
        isGameOver:true
      })
    }
  }

  handleResign() {
    //Do nothing if the game is over
    if(this.state.isGameOver) {
      return;
    }
    let newErrorMessage="";
    if (this.state.currentPlayer==='b') {
      newErrorMessage="White wins by resignation!"
    }
    else {
      newErrorMessage="Black wins by resignation!"
    }
    this.setState({
      errorMessage:newErrorMessage,
      isGameOver:true,
    });
  }

  renderGameInfo() {
    return (
      <div className="game-info">
        <div className="player1-info">
          <h3>
            Player 1
          </h3>
          {this.state.player1Captures} captures
        </div>
        <div className="player2-info">
          <h3>
            Player 2
          </h3>
          {this.state.player2Captures} captures
        </div>
        <div className="turn-info">
          {this.state.playerTurnStatus}
          <br></br>
          {this.state.errorMessage}
        </div>
        <div className="pass-resign-container">
          <button className="pass-button" onClick={this.handlePass}>
            Pass
          </button>
          <button className="resign-button" onClick={this.handleResign}>
            Resign
          </button>
        </div>
      
      </div>

    );
  }

  renderCoord(i) {
    return (
      <div className="coords-box">
        {i}
      </div>
    );
  } 

  renderCoords() {
    const boardSize=10;
    let outCoords=[]
    for(let i=0;i<boardSize;i++) {
      outCoords.push(this.renderCoord(i));
    }
    console.log(outCoords.length)
    return (
      <div className="vertical-coords-container">
        {outCoords}
      </div>
    );
  }

  render() {

    return (
      <div className="game">
        {this.renderCoords()}
        <div className="game-board">
          <Board
          board={this.state.board}
          boardSize={this.state.boardSize}
          onClick={(i,j)=>this.handleClick(i,j)}
          currentPlayer={this.state.currentPlayer}
          isGameOver={this.state.isGameOver}
          >
          </Board>
        </div>
        {this.renderGameInfo()}
      </div>
    );
    
  }
}


function App() {
  return (
    <div className="App">
      <div className="Game">
        <Game />
      </div>
    </div>
  );
}



export default App;