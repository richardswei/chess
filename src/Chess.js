import React, {Component} from 'react';
import './chess.css';
import * as chessHelpers from './chessHelpers.js'

class Chess extends Component {
  constructor(props) {
    super(props);
    this.handleNewGame = this.handleNewGame.bind(this);
    this.handleLoadGame = this.handleLoadGame.bind(this);
    this.handleSquareClick = this.handleSquareClick.bind(this);
    this.state = {
      boardSetup: chessHelpers.defaultSetupWhite, /*an array of coordinate-piece objects*/
      highlightedSquares: {}, 
      hotSquare: null, /*coordinate of the square that's toggled on and prepped for a move*/
      playerTurn: "white",
      check: false,
      enPassantAvailableAt: [null, null],
      positionsInCheck: {},
    }
  }

  componentDidMount() {
    // saveAllPossibleMoves
    const copyBoardSetup = JSON.parse(JSON.stringify(this.state.boardSetup))
    const boardWithMoves = this.updateBoardWithMoves(copyBoardSetup, {})
    this.setState({
      boardSetup: boardWithMoves,
    });
  }

  handleNewGame() {
  }

  handleLoadGame() {
  }

  getEligibleStandardMoves(squareRank, squareFile, boardSetup) {
    // check if this square has a piece
    const currentPiece = chessHelpers.getValueAtSquare(squareRank, squareFile, boardSetup);
    if (!currentPiece) return false;
    const currentPosition = [squareFile, squareRank];
    const pieceAttributes = chessHelpers.pieceAttributes[currentPiece.pieceType]
    const unitMoves = pieceAttributes.unitMoves;
    const newCoordinates = unitMoves.map((deltaCoord) => {
      const negativeIfWhite = currentPiece.pieceColor==='white' ? -1 : 1;  
      return [(squareFile+negativeIfWhite*deltaCoord[0]), (squareRank+negativeIfWhite*deltaCoord[1])] 
    });
    // first check for any directions that don't immediately go off-board
    const eligibleUnitMoves = newCoordinates.filter((coord) => {
      if (coord[0]<0 || coord[0]>7 || coord[1]<0 || coord[1]>7) return false;
      // examine target square's occupants 
      const occupant = chessHelpers.getValueAtSquare(coord[1], coord[0], boardSetup);
      // return false if pawn is blocked
      if (occupant && currentPiece.pieceType==="pawn") return false; 
      const occupantColor = occupant ? occupant.pieceColor : null;
      return (occupantColor===currentPiece.pieceColor) ? false : true; // cannot capture own piece
    })
    // if piece does not have ultd range then return otherwise recurse with extendForUnlimitedRange 
    if (!pieceAttributes.unlimitedRange) {
      return eligibleUnitMoves;
    } else {
      // we use existing unit moves to extend range since all relevant pieces use straight line movement
      if (eligibleUnitMoves.length===0) return null;
      const eligibleDeltas = eligibleUnitMoves.map((coord)=> [coord[0]-squareFile, coord[1]-squareRank] );
      const movesUnlimitedRange = eligibleDeltas.map((deltaCoord)=>{
        return this.extendForUnlimitedRange(currentPiece, currentPosition, deltaCoord, boardSetup)
      });
      return movesUnlimitedRange.flat();
    }
  }

  extendForUnlimitedRange(piece, currentPosition, deltaMovement, boardSetup, eligibleMoves=[]) {
    const dx=deltaMovement[0];
    const dy=deltaMovement[1];
    const newCoord = [currentPosition[0]+dx, currentPosition[1]+dy]
    // check if offBoard

    const coordinateIsOffBoard = newCoord[0]<0 || newCoord[0]>7 || newCoord[1]<0 || newCoord[1]>7
    if (coordinateIsOffBoard) {
      return eligibleMoves
    }
    // see if occupant exists in space 
    const occupant = chessHelpers.getValueAtSquare(newCoord[1], newCoord[0], boardSetup);
    const occupantColor = occupant ? occupant.pieceColor : null;
    if (occupantColor===piece.pieceColor) {
      return eligibleMoves;
    } else if (occupantColor && occupantColor!==piece.pieceColor) {
      eligibleMoves.push(newCoord);
      return eligibleMoves;
    }
    // if we get to this point we have an eligible coord
    // push and recurse
    eligibleMoves.push(newCoord);
    return this.extendForUnlimitedRange(piece, newCoord, deltaMovement, boardSetup, eligibleMoves)
  }

  handleSquareClick(props) {
    if (!this.state.hotSquare){
      const squares = chessHelpers.getValueAtSquare(props.coordinate[1], props.coordinate[0], this.state.boardSetup);
      this.setState((state) => ({
        highlightedSquares: squares ? squares.eligibleMoves : {},
        hotSquare: props.coordinate
      }))
    } else {
      this.executeMove(this.state.boardSetup, this.state.highlightedSquares, props.coordinate, this.state.hotSquare )
      this.setState((state) => ({
        highlightedSquares: {},
        hotSquare: null
      }))
    }
  }
  
  groupByRank(moveArray) {
    return moveArray.reduce(function (acc, obj) {
      let rank = obj[1];
      if (!acc[rank]) {
        acc[rank] = {};
      }
      acc[rank][obj[0]] = true;
      return acc;
    }, {});
  }
  
  getPawnSpecialMoves(rank, file, boardSetup, stateObj) {
    // no need to check for offboard here; 
    // capture and doublestep moves restrict to board space
    // enpassant capture already restricted in state setter
    let validMoves = [];
    const currentPiece = boardSetup[rank][file];
    if (currentPiece.pieceType==='pawn') {
      const negativeIfWhite = (currentPiece.pieceColor==='white') ? -1 : 1

      /*CHECK FOR DIAGONAL CAPTURE*/
      const captureCoordinates = chessHelpers.pawnSpecialMoves
        .diagonalCapture.map((move) => {
          const newX = move[0]+file;
          const newY = negativeIfWhite*move[1]+rank;
          return [newX, newY];
        });
      /*if boardSetup's captureCoordinates contain enemies, 
      then add capture coordinates*/
      const eligibleCapture = captureCoordinates.filter((coord) => {
        const colorAndPiece = chessHelpers.getValueAtSquare(coord[1], coord[0], boardSetup)
        return colorAndPiece && colorAndPiece.pieceColor!==currentPiece.pieceColor;
      });
      validMoves.push(...eligibleCapture);

      /*CHECK FOR DOUBLESTEP*/
      if (!currentPiece.hasMoved) {
        /*  if pawn is on the second rank and no piece is two in front
        add double advancement coordinates */ 
        const blocked = 
          chessHelpers.getValueAtSquare(rank+negativeIfWhite*2, file, boardSetup) ||
          chessHelpers.getValueAtSquare(rank+negativeIfWhite*1, file, boardSetup);
        if (!blocked) {
          validMoves.push([file, rank+negativeIfWhite*2])
        }
      }
      /*CHECK FOR EN PASSANT*/
      if (stateObj.enPassantAvailableAt) {
        const vulnerablePawnPosition = stateObj.enPassantAvailableAt
        const enPassantMoves = this
          .getEnPassantThreats(vulnerablePawnPosition[1], vulnerablePawnPosition[0])
        if (chessHelpers.getValueAtSquare(rank,file,enPassantMoves)) {
          validMoves.push([vulnerablePawnPosition[0],vulnerablePawnPosition[1]+negativeIfWhite])
        }
      }
    }
    return validMoves;
  }

  executeMove(boardSetup, highlightedSquares, targetSquare, hotSquare) {
    const originRank = hotSquare[1];
    const originFile = hotSquare[0];
    const valueOrigin = chessHelpers.getValueAtSquare(originRank, originFile, boardSetup);
    if (!valueOrigin) return false;
    if (valueOrigin.pieceColor!==this.state.playerTurn) return false; 
    const targetRank = targetSquare[1];
    const targetFile = targetSquare[0];
    if (chessHelpers.getValueAtSquare(targetRank, targetFile, highlightedSquares)) {
      /*access boardSetup, pull the item from the hotSquare, overwrite boardSetup at the keys*/
      const copyBoardSetup = JSON.parse(JSON.stringify(boardSetup))
      // move piece
      if (!copyBoardSetup[targetRank]){
        copyBoardSetup[targetRank]={}
      }
      // move piece from origin to target. set the hasMoved property to true
      copyBoardSetup[originRank][originFile].hasMoved=true
      copyBoardSetup[targetRank][targetFile]=copyBoardSetup[originRank][originFile];
      copyBoardSetup[originRank][originFile]=null;
      const movingPiece = copyBoardSetup[targetRank][targetFile].pieceType
      // if enPassant was available and movingPiece is
      // a pawn that moved behind the pawn, then EP happened
      const newStateObject = {};
      if (movingPiece==='pawn') {
        if (this.state.enPassantAvailableAt[0]===targetFile && 
          this.state.enPassantAvailableAt[1]===originRank){
            copyBoardSetup[originRank][targetFile]=null;
        }
      }
      if (movingPiece==='pawn' && Math.abs(targetRank-originRank)===2) {
        newStateObject.enPassantAvailableAt = targetSquare;
      } else {
        newStateObject.enPassantAvailableAt = [null, null];
      }
      const boardSetupUpdated =  this.updateBoardWithMoves(copyBoardSetup, newStateObject);      
      // saveAllPossibleMoves
      this.setState({
        boardSetup: boardSetupUpdated,
        playerTurn: this.state.playerTurn==="white" ? "black" : "white",
        ...newStateObject
      });
    } else {
      return
    }
  }

  updateBoardWithMoves(boardSetup, newStateObject={}) {
    for (var rank=0; rank<8; rank++){
      for (var file=0; file<8; file++){
        try {
          // find piece
          const movesetList = this.getEligibleStandardMoves(rank, file, boardSetup);
          if (!movesetList) continue;
          const withSpecialPawnMoves = movesetList.concat(this.getPawnSpecialMoves(rank, file, boardSetup, newStateObject));
          boardSetup[rank][file].eligibleMoves = this.groupByRank(withSpecialPawnMoves);
          // console.log(boardSetup)
        } catch {
          continue;
        }
      }
    }
    return boardSetup
  }

  getEnPassantThreats(rank, file) {
    if (!rank || !file) return {};
    const eligible = [];
    if (file-1>=0) {
      eligible.push([file-1, rank]);
    }
    if (file+1<8) {
      eligible.push([file+1, rank]);
    }
    return this.groupByRank(eligible)
  }

  render() {
    return this.state && <Board className="board"
      handleSquareClick={this.handleSquareClick}
      {...this.state}
    ></Board>
  }
}

class Board extends Component {
  constructor(props) {
    super(props);
    this.renderSquare = this.renderSquare.bind(this);
  }

  renderSquare(squareId, rank, file, piece) {
    return <Square 
      key={squareId}
      color={(rank%2+squareId%2
        /*this plus one for rotating board*/
        +1 )%2===0 ? "black" : "white"}
      highlighted={chessHelpers.getValueAtSquare(rank, file,this.props.highlightedSquares)}
      coordinate={[file,rank]}
      symbol = {this.getPieceSymbol(piece)}
      {...this.props}
      // {...this.getPieceAttributes(piece)}
    ></Square>
  }

  getPieceAttributes(currentChesspiece) {
    try {
      return chessHelpers.pieceAttributes[currentChesspiece.pieceType]
    } catch {
      return {}
    }
  }
  getPieceSymbol(currentChesspiece) {
    const pieceColor = currentChesspiece ? currentChesspiece.pieceColor : null;
    const pieceType = currentChesspiece ? currentChesspiece.pieceType : null;
    try {
      return chessHelpers.chess_unicode[pieceColor][pieceType]
    } catch {
      return null
    }
  }

  getHighlightedStatus(highlightedSquares, rank, file) {
    try {
      return highlightedSquares[rank][file] ? true : false
    } catch {
      return false
    }
  }

  render() {
    const boardSetup = this.props.boardSetup;
    const boardRows = Array(8).fill(1).map((_, i) => i);
    const boardCols = Array(8).fill(1).map((_, i) => i);
    return boardSetup && <div>
      {
        boardRows.map((row) => {
          return <div className="boardRow" key={row}>
            {
              boardCols.map((column) => {
                const rank = row;
                const file = column;
                const squareId = row*8+file;
                const piece=chessHelpers.getValueAtSquare(rank, file, boardSetup);
                return this.renderSquare(squareId, rank, file, piece)
              })
            }
          </div>
        
        })
      }
    </div>
  }
}

class Square extends Component {
  render() {
    const highlighted = this.props.highlighted
    return <button 
      onClick={() => this.props.handleSquareClick(this.props)}
      className={`${this.props.color} ${highlighted ? 'highlighted' : ''} square `}>
        {this.props.symbol && <Piece
        symbol={this.props.symbol}
      ></Piece>}
    </button>
  }
}

class Piece extends Component {

  render() {
    return <div >
      {this.props.symbol}
    </div>
  }
}

class Player extends Component {

}



export default Chess;