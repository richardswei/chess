
export function groupByRank(moveArray) {
    return moveArray.reduce(function (acc, obj) {
      let rank = obj[1];
      if (!acc[rank]) {
        acc[rank] = {};
      }
      acc[rank][obj[0]] = true;
      return acc;
    }, {});
  }

export function getValueAtSquare(rank, file, board) {
  try {
    return board[rank][file]
  } 
  catch(error) {
    return null;
  }
}

export function getEnPassantThreats(rank, file) {
    if (rank===null || file===null) return {};
    const eligible = [];
    if (file-1>=0) {
      eligible.push([file-1, rank]);
    }
    if (file+1<8) {
      eligible.push([file+1, rank]);
    }
    return groupByRank(eligible)
  }

export function getKingSpecialMoves(rank, file, boardSetup) {
  const currentPiece = boardSetup[rank][file];
  if (currentPiece.pieceType==='king' && !currentPiece.hasMoved) {
    const emptyFilesRequired = {
      0: [1,2,3],
      7: [5,6]
    };
    const kingSpecialMoves = [];
    const defaultRookFiles = [0, 7];
    const threatenedSquares = getThreatsAgainstPlayer(boardSetup, currentPiece.pieceColor);

    // cannot castle while in check
    if (getValueAtSquare(rank, file, threatenedSquares)) return [];

    // check if spaces are empty or in check
    defaultRookFiles.forEach((rookFile) => {
      const potentialRook = getValueAtSquare(rank, rookFile, boardSetup);

      // check if the piece hasMoved
      if (!potentialRook.hasMoved) {
        const castleIneligible = emptyFilesRequired[rookFile].map((emptyFile) => {
          const square = getValueAtSquare(rank, emptyFile, boardSetup);
          if (square) return true;
          if (getValueAtSquare(rank, emptyFile, threatenedSquares)) return true;
          return false;
        }).reduce((a, b) =>  (a || b) ? true : false );
        if (!castleIneligible) {
          const castleDestination = rookFile<4 ? 2 : 6;
          kingSpecialMoves.push([castleDestination, rank]);
        }
      }        
    })
    return kingSpecialMoves;
  } else return [];
}

export function getPawnSpecialMoves(rank, file, boardSetup, stateObj) {
  // no need to check for offboard here; 
  // capture and doublestep moves restrict to board space
  // enpassant capture already restricted in state setter
  let validMoves = [];
  const currentPiece = boardSetup[rank][file];
  if (currentPiece.pieceType==='pawn') {
    const directionalConstant = (currentPiece.pieceColor==='black') ? -1 : 1

    /*CHECK FOR DIAGONAL CAPTURE*/
    const captureCoordinates = pawnSpecialMoves
      .diagonalCapture.map((move) => {
        const newX = move[0]+file;
        const newY = directionalConstant*move[1]+rank;
        return [newX, newY];
      });
    /*if boardSetup's captureCoordinates do not contain enemies,
    filter out capture coordinates*/
    const eligibleCapture = captureCoordinates.filter((coord) => {
      const colorAndPiece = getValueAtSquare(coord[1], coord[0], boardSetup)
      return colorAndPiece && colorAndPiece.pieceColor!==currentPiece.pieceColor;
    });
    validMoves.push(...eligibleCapture);

    /*CHECK FOR DOUBLESTEP*/
    if (!currentPiece.hasMoved) {
      /*  if pawn has not moved and no piece is two or one in front
      add double advancement coordinates */ 
      const blocked = 
        getValueAtSquare(rank+directionalConstant*2, file, boardSetup) ||
        getValueAtSquare(rank+directionalConstant*1, file, boardSetup);
      if (!blocked) {
        validMoves.push([file, rank+directionalConstant*2])
      }
    }
    /*CHECK FOR EN PASSANT*/
    if (stateObj.enPassantAvailableAt) {
      const vulnerablePawnPosition = stateObj.enPassantAvailableAt
      const enPassantMoves = getEnPassantThreats(vulnerablePawnPosition[1], vulnerablePawnPosition[0])
      if (getValueAtSquare(rank,file,enPassantMoves)) {
        validMoves.push([vulnerablePawnPosition[0],vulnerablePawnPosition[1]+directionalConstant])
      }
    }
  }
  return validMoves;
}

export function updateOpponentKingMoves(boardSetup, threatenedSpaces, color) {
  for (let rank=0; rank<8; rank++){
    for (let file=0; file<8; file++){
      let piece = getValueAtSquare(rank, file, boardSetup);
      if (!piece) continue;
      if (color===piece.pieceColor && piece.pieceType ==='king'){
        boardSetup[rank][file].eligibleMovesList = piece.eligibleMovesList.filter((move) => {
          return getValueAtSquare(move[1], move[0], threatenedSpaces)  ? false : true
        });
        return boardSetup
      } else {
        continue;
      }
    }
  }
}

export function getThreatsAgainstPlayer(boardSetup, color) {
  var threatenedSpaces = [];
  for (let rank=0; rank<8; rank++){
    for (let file=0; file<8; file++){
      try {
        const piece = boardSetup[rank][file];
        if (piece.pieceColor===color) continue;
        if (piece.pieceType==='pawn' ) {
          const directionalConstant = piece.pieceColor==="black" ? -1 : 1;
          threatenedSpaces=threatenedSpaces
            .concat([[file+1, rank+directionalConstant],[file-1, rank+directionalConstant]])
        } else {
          threatenedSpaces = threatenedSpaces.concat(piece.eligibleMovesList)
        }
      } catch {
        continue;
      }
    }
  }
  return groupByRank(threatenedSpaces)
}

export function updateBoardWithMoves(boardSetup, newStateObject={}) {
  const copyBoardSetup = JSON.parse(JSON.stringify(boardSetup))
  for (let rank=0; rank<8; rank++){
    for (let file=0; file<8; file++){
      try {
        // find piece
        let movesetList = getEligibleStandardMoves(rank, file, copyBoardSetup);
        if (!movesetList) continue;

        const currentPieceType = copyBoardSetup[rank][file].pieceType
        if (currentPieceType === "king") {
          movesetList = movesetList.concat(getKingSpecialMoves(rank, file, copyBoardSetup));
        }
        if (currentPieceType === "pawn") {
          movesetList = movesetList.concat(getPawnSpecialMoves(rank, file, copyBoardSetup, newStateObject));
        }
        
        copyBoardSetup[rank][file].eligibleMovesList = movesetList;
      } catch {
        continue;
      }
    }
  }
  return copyBoardSetup
}

export function getUnthreatenedSpaces(coordinateArray, threatColor, threatSet) {
  const filteredCoords = coordinateArray.filter((coordinate) => {
    return !threatSet.includes(coordinate)
  });
  return filteredCoords
}

export function getEligibleStandardMoves(squareRank, squareFile, boardSetup) {
   // check if this square has a piece
  const currentPiece = getValueAtSquare(squareRank, squareFile, boardSetup);
  if (!currentPiece) return false;
  const currentPosition = [squareFile, squareRank];
  const piece = pieceAttributesByType[currentPiece.pieceType]
  const unitMoves = piece.unitMoves;
  const newCoordinates = unitMoves.map((deltaCoord) => {
    const directionalConstant = currentPiece.pieceColor==='black' ? -1 : 1;  
    return [(squareFile+directionalConstant*deltaCoord[0]), (squareRank+directionalConstant*deltaCoord[1])] 
  });
  // first check for any directions that don't immediately go off-board
  const eligibleUnitMoves = newCoordinates.filter((coord) => {
    if (coord[0]<0 || coord[0]>7 || coord[1]<0 || coord[1]>7) return false;
    // examine target square's occupants 
    const occupant = getValueAtSquare(coord[1], coord[0], boardSetup);
    // return false if pawn is blocked
    if (occupant && currentPiece.pieceType==="pawn") return false; 
    const occupantColor = occupant ? occupant.pieceColor : null;
    return (occupantColor===currentPiece.pieceColor) ? false : true; // cannot capture own piece
  })
  // if piece does not have ultd range then return otherwise recurse with extendForUnlimitedRange 
  if (!piece.unlimitedRange) {
    return eligibleUnitMoves;
  } else {
    // we use existing unit moves to extend range since all relevant pieces use straight line movement
    if (eligibleUnitMoves.length===0) return [];
    const eligibleDeltas = eligibleUnitMoves.map((coord)=> [coord[0]-squareFile, coord[1]-squareRank] );
    const movesUnlimitedRange = eligibleDeltas.map((deltaCoord)=>{
      return extendForUnlimitedRange(currentPiece, currentPosition, deltaCoord, boardSetup)
    });
    return movesUnlimitedRange.flat();
  }
}

export function extendForUnlimitedRange(piece, currentPosition, deltaMovement, boardSetup, eligibleMovesList=[]) {
  const dx=deltaMovement[0];
  const dy=deltaMovement[1];
  const newCoord = [currentPosition[0]+dx, currentPosition[1]+dy]
  // check if offBoard

  const coordinateIsOffBoard = newCoord[0]<0 || newCoord[0]>7 || newCoord[1]<0 || newCoord[1]>7
  if (coordinateIsOffBoard) {
    return eligibleMovesList
  }
  // see if occupant exists in space 
  const occupant = getValueAtSquare(newCoord[1], newCoord[0], boardSetup);
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
  return extendForUnlimitedRange(piece, newCoord, deltaMovement, boardSetup, eligibleMovesList)
}

export function searchForChecks(kingColor, kingPosition, boardSetup) {
  // function checks if the current king is checked
  const threatenedCoordinates = getThreatsAgainstPlayer(boardSetup, kingColor)
  const kingThreatened = getValueAtSquare(kingPosition[1], kingPosition[0], threatenedCoordinates)
  return kingThreatened ? true : false
}


export function eligibleMovesExist(color, boardSetup, stateObj) {
  /*
  return true if even a single legal move exists (for checkmate and stalemate)
  loop through each square
  find eligible moves
  for each eligible move, create a copy of the board, make the move, and look for a threat to king
  if no threat, get out, return true
  else continue
  if loop through all, return false
  */

  for(let rank=0; rank<8; rank++) {
    for(let file=0; file<8; file++) {
      const piece = getValueAtSquare(rank, file, boardSetup);
      if (!piece) {continue;}
      if (piece.pieceColor===color) {
        for (const coordinate of piece.eligibleMovesList) {
          const targetFile = coordinate[0];
          const targetRank = coordinate[1];
          let copyBoardSetup = JSON.parse(JSON.stringify(boardSetup));
          if (!copyBoardSetup[targetRank]){
            copyBoardSetup[targetRank]={}
          }
          copyBoardSetup[targetRank][targetFile]=copyBoardSetup[rank][file];
          copyBoardSetup[rank][file]=null;
          let newStateObject = {};
          newStateObject.enPassantAvailableAt = stateObj.enPassantAvailableAt;
          newStateObject.whiteKingPosition = stateObj.whiteKingPosition;
          newStateObject.blackKingPosition = stateObj.blackKingPosition;
          newStateObject.check = stateObj.check;
          const movingPiece = copyBoardSetup[targetRank][targetFile];
          const originSquare = [rank, file];

          copyBoardSetup = manageSpecialMoves(movingPiece, originSquare, coordinate, copyBoardSetup, newStateObject)

          newStateObject = manageEnPassantState(movingPiece, originSquare, coordinate, newStateObject);
          newStateObject = manageKingMove(movingPiece, coordinate, newStateObject);
          let boardSetupUpdated = updateBoardWithMoves(copyBoardSetup, newStateObject);      
          const checkStillExists = searchForChecks(color, newStateObject[color+'KingPosition'], boardSetupUpdated);
          if (!checkStillExists) {
            return true; 
          }
        }
      }
    }
  }
  return false
}

export function manageEnPassant(movingPiece, origin, target, boardSetup, newStateObject) {
  if (movingPiece.pieceType==='pawn') {
    if (newStateObject.enPassantAvailableAt[0]===target[0] && 
      newStateObject.enPassantAvailableAt[1]===origin[1]){
        boardSetup[origin[1]][target[0]]=null;
    }
  }
  return boardSetup
}

export function manageCastle(movingPiece, origin, target, boardSetup) {
  if (movingPiece.pieceType==='king') {
    const spacesMoved = target[0]-origin[0];
    const kingRank = target[1];
    if ( Math.abs(spacesMoved)===2 ){
      switch(spacesMoved<0) {
        case true: // if queenside
          if (!boardSetup[5]){
            boardSetup[5]={}
          }
          boardSetup[kingRank][3] = boardSetup[kingRank][0]
          boardSetup[kingRank][0] = null;
          return boardSetup;
        case false: // if kingside
          if (!boardSetup[3]){
            boardSetup[3]={}
          }
          boardSetup[kingRank][5] = boardSetup[kingRank][7]
          boardSetup[kingRank][7] = null;
          return boardSetup;
        default: console.log('castle error')
      }
    }
  }
}

export function managePromotion(movingPiece, origin, target, boardSetup) {
  if (movingPiece.pieceType==='pawn') {
    if (target[1]===0 || target[1]===7) {
      // if a pawn reaches the last rank on either side, promote
      boardSetup[target[1]][target[0]].pieceType = 'queen';
    }
  }
  return boardSetup
}

export function manageKingMove(movingPiece, target, newStateObject) {
  if (movingPiece.pieceType==='king') {
    if (movingPiece.pieceColor==='black') {
      newStateObject.blackKingPosition = [target[0], target[1]];
    } else {
      newStateObject.whiteKingPosition = [target[0], target[1]];
    }
  }
  return newStateObject;
}

export function manageSpecialMoves(movingPiece, origin, target, boardSetup, newStateObject) {
  const updateBoard1 = manageEnPassant(movingPiece, origin, target, boardSetup, newStateObject);
  const updateBoard2 = manageCastle(movingPiece, origin, target, boardSetup);
  return managePromotion(movingPiece, origin, target, updateBoard1);
}

export function manageEnPassantState(movingPiece, origin, target, newStateObject) {
  if (movingPiece.pieceType==='pawn' && Math.abs(target[1]-origin[1])===2) {
    newStateObject.enPassantAvailableAt = target;
  } else {
    newStateObject.enPassantAvailableAt = [null, null];
  }
  return newStateObject
}

/*
  CONSTANTS
*/

export const chess_unicode = {
  white: {king: '\u2654',
    queen: '\u2655',
    rook: '\u2656',
    bishop: '\u2657',
    knight: '\u2658',
    pawn: '\u2659'
  },
  black: {king: '\u265A',
    queen: '\u265B',
    rook: '\u265C',
    bishop: '\u265D',
    knight: '\u265E',
    pawn: '\u265F'
  }
}

export const pieceAttributes = {
  // moves in form of [dx, dy]
  king: {
    unlimitedRange: false,
    unitMoves: [[0,1],[0,-1],[-1,0],[1,0],[1,1],[-1,-1],[-1,1],[1,-1]],
  },
  queen: {
    unlimitedRange: true,
    unitMoves: [[0,1],[0,-1],[-1,0],[1,0],[1,1],[-1,-1],[-1,1],[1,-1]],
  },
  rook: {
    unlimitedRange: true,
    unitMoves: [[0,1],[0,-1],[-1,0],[1,0]],
  },
  bishop: {
    unlimitedRange: true,
    unitMoves: [[1,1],[-1,-1],[-1,1],[1,-1]],
  },
  knight: {
    unlimitedRange: false,
    unitMoves: [[1,2],[-1,-2],[1,-2],[-1,2],[2,1],[-2,-1],[2,-1],[-2,1]],
  },
  pawn: {
    unlimitedRange: false,
    unitMoves: [[0,1]],
  }
}

export const pieceAttributesByType = {
  'king': pieceAttributes.king,
  'queen': pieceAttributes.queen,
  'rook': pieceAttributes.rook,
  'bishop': pieceAttributes.bishop,
  'knight': pieceAttributes.knight,
  'pawn': pieceAttributes.pawn,
}

export const defaultSetupWhite = {
  // Hash by ranks white POV
  // Nest by file
  0: { 
    0:{pieceColor: 'white', pieceType: 'rook', eligibleMovesList: [], hasMoved:false},
    1:{pieceColor: 'white', pieceType: 'knight', eligibleMovesList: [], hasMoved:false},
    2:{pieceColor: 'white', pieceType: 'bishop', eligibleMovesList: [], hasMoved:false},
    3:{pieceColor: 'white', pieceType: 'queen', eligibleMovesList: [], hasMoved:false},
    4:{pieceColor: 'white', pieceType: 'king', eligibleMovesList: [], hasMoved:false,},
    5:{pieceColor: 'white', pieceType: 'bishop', eligibleMovesList: [], hasMoved:false},
    6:{pieceColor: 'white', pieceType: 'knight', eligibleMovesList: [], hasMoved:false},
    7:{pieceColor: 'white', pieceType: 'rook', eligibleMovesList: [], hasMoved:false} 
  }, 1: { 
    0:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
    1:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
    2:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
    3:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
    4:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
    5:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
    6:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
    7:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false} 
  }, 6: { 
    0:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
    1:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
    2:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
    3:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
    4:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
    5:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
    6:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
    7:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false} 
  }, 7: { 
    0:{pieceColor: 'black', pieceType: 'rook', eligibleMovesList: [], hasMoved:false},
    1:{pieceColor: 'black', pieceType: 'knight', eligibleMovesList: [], hasMoved:false},
    2:{pieceColor: 'black', pieceType: 'bishop', eligibleMovesList: [], hasMoved:false},
    3:{pieceColor: 'black', pieceType: 'queen', eligibleMovesList: [], hasMoved:false},
    4:{pieceColor: 'black', pieceType: 'king', eligibleMovesList: [], hasMoved:false,},
    5:{pieceColor: 'black', pieceType: 'bishop', eligibleMovesList: [], hasMoved:false},
    6:{pieceColor: 'black', pieceType: 'knight', eligibleMovesList: [], hasMoved:false},
    7:{pieceColor: 'black', pieceType: 'rook', eligibleMovesList: [], hasMoved:false} 
  }
}
export const pawnSpecialMoves = {
  diagonalCapture:[[-1,1],[1,1]],
  // doubleStep added without this object
}
export const kingSpecialMoves = {
  queensideCastle:[[-2,0]],
  kingsideCastle:[[2,0]]
}
export const rookSpecialMoves = {
  queensideCastle:[[2,0]],
  kingsideCastle:[[-2,0]]
}

export const defaultState = {
      lastMove: "New Game",
      history: [],
      blackOnTop: true,
      boardSetup: defaultSetupWhite, /*an array of coordinate-piece objects*/
      highlightedSquares: {}, 
      hotSquare: null, /*coordinate of the square that's toggled on and prepped for a move*/
      playerTurn: "white",
      check: false,
      enPassantAvailableAt: [null, null],
      threatenedSpaces: [],
      whiteKingPosition: [4,0], 
      blackKingPosition: [4,7], 
      jumbotronMessage: "WHITE's Move"
    }

export const fileCoordinates = ["A","B","C","D","E","F","G","H"]