
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


export function getPawnSpecialMoves(rank, file, boardSetup, stateObj) {
  // no need to check for offboard here; 
  // capture and doublestep moves restrict to board space
  // enpassant capture already restricted in state setter
  let validMoves = [];
  const currentPiece = boardSetup[rank][file];
  if (currentPiece.pieceType==='pawn') {
    const negativeIfWhite = (currentPiece.pieceColor==='white') ? -1 : 1

    /*CHECK FOR DIAGONAL CAPTURE*/
    const captureCoordinates = pawnSpecialMoves
      .diagonalCapture.map((move) => {
        const newX = move[0]+file;
        const newY = negativeIfWhite*move[1]+rank;
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
        getValueAtSquare(rank+negativeIfWhite*2, file, boardSetup) ||
        getValueAtSquare(rank+negativeIfWhite*1, file, boardSetup);
      if (!blocked) {
        validMoves.push([file, rank+negativeIfWhite*2])
      }
    }
    /*CHECK FOR EN PASSANT*/
    if (stateObj.enPassantAvailableAt) {
      const vulnerablePawnPosition = stateObj.enPassantAvailableAt
      const enPassantMoves = getEnPassantThreats(vulnerablePawnPosition[1], vulnerablePawnPosition[0])
      if (getValueAtSquare(rank,file,enPassantMoves)) {
        validMoves.push([vulnerablePawnPosition[0],vulnerablePawnPosition[1]+negativeIfWhite])
      }
    }
  }
  return validMoves;
}

export function updateOpponentKingMoves(boardSetup, threatenedSpaces, color) {
  for (var rank=0; rank<8; rank++){
    for (var file=0; file<8; file++){
      let piece = getValueAtSquare(rank, file, boardSetup);
      if (!piece) continue;
      if (color===piece.pieceColor && piece.pieceType ==='king'){
				console.log(threatenedSpaces)
				console.log(boardSetup[rank][file].eligibleMovesList)
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
  const negativeIfWhite = color==="whit}e" ? -1 : 1;
  var threatenedSpaces = [];
  for (var rank=0; rank<8; rank++){
    for (var file=0; file<8; file++){
      try {
        const piece = boardSetup[rank][file];
        if (piece.pieceColor===color) continue;
        if (piece.pieceType==='pawn' ) {
          threatenedSpaces= threatenedSpaces
            .concat([[file+1, rank+negativeIfWhite],[file-1, rank+negativeIfWhite]])
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
  for (var rank=0; rank<8; rank++){
    for (var file=0; file<8; file++){
      try {
        // find piece
        const movesetList = this.getEligibleStandardMoves(rank, file, boardSetup);
        if (!movesetList) continue;
        const withSpecialPawnMoves = movesetList.concat(getPawnSpecialMoves(rank, file, boardSetup, newStateObject));
        
        boardSetup[rank][file].eligibleMovesList = withSpecialPawnMoves;
      } catch {
        continue;
      }
    }
  }
  return boardSetup
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
    const negativeIfWhite = currentPiece.pieceColor==='white' ? -1 : 1;  
    return [(squareFile+negativeIfWhite*deltaCoord[0]), (squareRank+negativeIfWhite*deltaCoord[1])] 
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
    if (eligibleUnitMoves.length===0) return null;
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

export function searchForChecks(kingColor, kingPosition, boardSetup){
	// function checks if the current king is checked
	getThreatsAgainstPlayer(boardSetup, kingColor)
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
		0:{pieceColor: 'black', pieceType: 'rook', eligibleMovesList: [], hasMoved:false},
		1:{pieceColor: 'black', pieceType: 'knight', eligibleMovesList: []},
		2:{pieceColor: 'black', pieceType: 'bishop', eligibleMovesList: []},
		3:{pieceColor: 'black', pieceType: 'queen', eligibleMovesList: []},
		4:{pieceColor: 'black', pieceType: 'king', eligibleMovesList: [], hasMoved:false, inCheck: false},
		5:{pieceColor: 'black', pieceType: 'bishop', eligibleMovesList: []},
		6:{pieceColor: 'black', pieceType: 'knight', eligibleMovesList: []},
		7:{pieceColor: 'black', pieceType: 'rook', eligibleMovesList: [], hasMoved:false} 
	}, 1: { 
		0:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		1:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		2:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		3:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		4:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		5:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		6:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		7:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false} 
	}, 6: { 
		0:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		1:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		2:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		3:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		4:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		5:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		6:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		7:{pieceColor: 'white', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false} 
	}, 7: { 
		0:{pieceColor: 'white', pieceType: 'rook', eligibleMovesList: [], hasMoved:false},
		1:{pieceColor: 'white', pieceType: 'knight', eligibleMovesList: []},
		2:{pieceColor: 'white', pieceType: 'bishop', eligibleMovesList: []},
		3:{pieceColor: 'white', pieceType: 'queen', eligibleMovesList: []},
		4:{pieceColor: 'white', pieceType: 'king', eligibleMovesList: [], hasMoved:false, inCheck: false},
		5:{pieceColor: 'white', pieceType: 'bishop', eligibleMovesList: []},
		6:{pieceColor: 'white', pieceType: 'knight', eligibleMovesList: []},
		7:{pieceColor: 'white', pieceType: 'rook', eligibleMovesList: [], hasMoved:false} 
	}
}
export const defaultSetupBlack = {
	// Hash by ranks black POV
	0: { 
		0:{pieceColor: 'white', pieceType: 'rook', eligibleMovesList: [], hasMoved:false},
		1:{pieceColor: 'white', pieceType: 'knight', eligibleMovesList: []},
		2:{pieceColor: 'white', pieceType: 'bishop', eligibleMovesList: []},
		3:{pieceColor: 'white', pieceType: 'queen', eligibleMovesList: []},
		4:{pieceColor: 'white', pieceType: 'king', eligibleMovesList: [], hasMoved:false, inCheck: false},
		5:{pieceColor: 'white', pieceType: 'bishop', eligibleMovesList: []},
		6:{pieceColor: 'white', pieceType: 'knight', eligibleMovesList: []},
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
		0:{pieceColor: 'black', pieceType: 'rook', eligibleMovesList: [], hasMoved:false},
		1:{pieceColor: 'black', pieceType: 'knight', eligibleMovesList: []},
		2:{pieceColor: 'black', pieceType: 'bishop', eligibleMovesList: []},
		3:{pieceColor: 'black', pieceType: 'queen', eligibleMovesList: []},
		4:{pieceColor: 'black', pieceType: 'king', eligibleMovesList: [], hasMoved:false, inCheck: false},
		5:{pieceColor: 'black', pieceType: 'bishop', eligibleMovesList: []},
		6:{pieceColor: 'black', pieceType: 'knight', eligibleMovesList: []},
		7:{pieceColor: 'black', pieceType: 'rook', eligibleMovesList: [], hasMoved:false} 
	}, 7: { 
		0:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		1:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		2:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		3:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		4:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		5:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		6:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false},
		7:{pieceColor: 'black', pieceType: 'pawn', eligibleMovesList: [], hasMoved:false} 
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