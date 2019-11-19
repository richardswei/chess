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
      threatenedSpaces: [],
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

  extendForUnlimitedRange(piece, currentPosition, deltaMovement, boardSetup, eligibleMovesList=[]) {
    const dx=deltaMovement[0];
    const dy=deltaMovement[1];
    const newCoord = [currentPosition[0]+dx, currentPosition[1]+dy]
    // check if offBoard

    const coordinateIsOffBoard = newCoord[0]<0 || newCoord[0]>7 || newCoord[1]<0 || newCoord[1]>7
    if (coordinateIsOffBoard) {
      return eligibleMovesList
    }
    // see if occupant exists in space 
    const occupant = chessHelpers.getValueAtSquare(newCoord[1], newCoord[0], boardSetup);
    const occupantColor = occupant ? occupant.pieceColor : null;
    if (occupantColor===piece.pieceColor) {
      return eligibleMovesList;
    } else if (occupantColor && occupantColor!==piece.pieceColor) {
      eligibleMovesList.push(newCoord);
      return eligibleMovesList;
    }
    // if we get to this point we have an eligible coord
    // push and recurse
    eligibleMovesList.push(newCoord);
    return this.extendForUnlimitedRange(piece, newCoord, deltaMovement, boardSetup, eligibleMovesList)
  }

  handleSquareClick(props) {
    if (!this.state.hotSquare){
      const square = chessHelpers.getValueAtSquare(props.coordinate[1], props.coordinate[0], this.state.boardSetup);
      this.setState((state) => ({
        highlightedSquares: square ? chessHelpers.groupByRank(square.eligibleMovesList) : {},
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
    
  
  executeMove(boardSetup, highlightedSquares, targetSquare, hotSquare) {
    if (!hotSquare) return false;
    const originRank = hotSquare[1];
    const originFile = hotSquare[0];
    const valueOrigin = chessHelpers.getValueAtSquare(originRank, originFile, boardSetup);
    if (!valueOrigin) return false;
    if (valueOrigin.pieceColor!==this.state.playerTurn) return false; 
    const targetRank = targetSquare[1];
    const targetFile = targetSquare[0];
    if (chessHelpers.getValueAtSquare(targetRank, targetFile, highlightedSquares)) {
      /*access boardSetup, pull the item from the hotSquare, overwrite boardSetup at the keys*/
      let copyBoardSetup = JSON.parse(JSON.stringify(boardSetup))
      // move piece
      if (!copyBoardSetup[targetRank]){
        copyBoardSetup[targetRank]={}
      }
      // move piece from origin to target. set the hasMoved property to true
      copyBoardSetup[originRank][originFile].hasMoved=true
      copyBoardSetup[targetRank][targetFile]=copyBoardSetup[originRank][originFile];
      copyBoardSetup[originRank][originFile]=null;
      const movingPiece = copyBoardSetup[targetRank][targetFile].pieceType
      let newStateObject = {};
      if (movingPiece==='pawn') {
        // if movingPiece is a pawn that moved behind the enemy pawn, 
        // then EP happened
        if (this.state.enPassantAvailableAt[0]===targetFile && 
          this.state.enPassantAvailableAt[1]===originRank){
            copyBoardSetup[originRank][targetFile]=null;
        }
        if (targetRank===0 || targetRank===7) {
          // if a pawn reaches the last rank on either side, promote
          copyBoardSetup[targetRank][targetFile].pieceType = 'queen';
        }
      }
      if (movingPiece==='pawn' && Math.abs(targetRank-originRank)===2) {
        newStateObject.enPassantAvailableAt = targetSquare;
      } else {
        newStateObject.enPassantAvailableAt = [null, null];
      }
      let boardSetupUpdated = this.updateBoardWithMoves(copyBoardSetup, newStateObject);      
      const threatenedSpaces = this.getThreatsForNextPlayer(boardSetupUpdated, this.state.playerTurn);
      boardSetupUpdated = this.manageNextPlayerKing(boardSetupUpdated, threatenedSpaces, this.state.playerTurn)
      // saveAllPossibleMoves
      this.setState({
        boardSetup: boardSetupUpdated,
        playerTurn: this.state.playerTurn==="white" ? "black" : "white",
        threatenedSpaces: threatenedSpaces,
        ...newStateObject
      });
    } else {
      return
    }
  }

  manageNextPlayerKing(boardSetup, threatenedSpaces, color) {
    for (var rank=0; rank<8; rank++){
      for (var file=0; file<8; file++){
        let piece = chessHelpers.getValueAtSquare(rank, file, boardSetup);
        if (!piece) continue;
        if (color!==piece.pieceColor && piece.pieceType ==='king'){

          boardSetup[rank][file].eligibleMovesList = piece.eligibleMovesList.filter((move) => {
            return chessHelpers.getValueAtSquare(move[1], move[0], threatenedSpaces)  ? false : true
          });
          return boardSetup
        } else {
          continue;
        }
      }
    }
  }

  getThreatsForNextPlayer(boardSetup, color) {
    const negativeIfWhite = color==="white" ? -1 : 1 
    var threatenedSpaces = [];
    for (var rank=0; rank<8; rank++){
      for (var file=0; file<8; file++){
        try {
          const piece = boardSetup[rank][file];
          if (piece.pieceColor!==color) continue;
          if (piece.pieceType==='pawn' ) {
            console.log(threatenedSpaces)
            threatenedSpaces= threatenedSpaces
              .concat([file+1, rank+negativeIfWhite])
              .concat([file-1, rank+negativeIfWhite])
          } else {
            threatenedSpaces = threatenedSpaces.concat(piece.eligibleMovesList)
          }
        } catch {
          continue;
        }
      }
    }
    return chessHelpers.groupByRank(threatenedSpaces)
  }

  updateBoardWithMoves(boardSetup, newStateObject={}) {
    for (var rank=0; rank<8; rank++){
      for (var file=0; file<8; file++){
        try {
          // find piece
          const movesetList = this.getEligibleStandardMoves(rank, file, boardSetup);
          if (!movesetList) continue;
          const withSpecialPawnMoves = movesetList.concat(this.getPawnSpecialMoves(rank, file, boardSetup, newStateObject));
          
          boardSetup[rank][file].eligibleMovesList = withSpecialPawnMoves;
        } catch {
          continue;
        }
      }
    }
    return boardSetup
  }

  getUnthreatenedSpaces(coordinateArray, threatColor, threatSet) {
    const filteredCoords = coordinateArray.filter((coordinate) => {
      return !threatSet.includes(coordinate)
    });
    return filteredCoords
      
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
      /*if boardSetup's captureCoordinates do not contain enemies, 
      filter out capture coordinates*/
      const eligibleCapture = captureCoordinates.filter((coord) => {
        const colorAndPiece = chessHelpers.getValueAtSquare(coord[1], coord[0], boardSetup)
        return colorAndPiece && colorAndPiece.pieceColor!==currentPiece.pieceColor;
      });
      validMoves.push(...eligibleCapture);

      /*CHECK FOR DOUBLESTEP*/
      if (!currentPiece.hasMoved) {
        /*  if pawn has not moved and no piece is two or one in front
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
        const enPassantMoves = chessHelpers
          .getEnPassantThreats(vulnerablePawnPosition[1], vulnerablePawnPosition[0])
        if (chessHelpers.getValueAtSquare(rank,file,enPassantMoves)) {
          validMoves.push([vulnerablePawnPosition[0],vulnerablePawnPosition[1]+negativeIfWhite])
        }
      }
    }
    return validMoves;
  }


  render() {
    return this.state && <div>
      <Jumbotron
        playerTurn={this.state.playerTurn}
      ></Jumbotron>
      <Board className="board"
        handleSquareClick={this.handleSquareClick}
        {...this.state}
      ></Board>
    </div>
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
      highlighted={chessHelpers.getValueAtSquare(rank, file, this.props.highlightedSquares)}
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
        {this.props.symbol && <div>{this.props.symbol}</div>}
    </button>
  }
}

class Jumbotron extends Component {

  render() {
    return <div >
      <h1>{this.props.playerTurn+"'s move"}</h1>
    </div>
  }
}

export default Chess;