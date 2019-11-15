

export function getValueAtSquare(rank, file, board) {
	try {
		return board[rank][file]
	} 
	catch(error) {
		return null;
	}
}

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

export const pieceAttributesByType = {
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

export const pieceAttributes = {
	'king': pieceAttributesByType.king,
	'queen': pieceAttributesByType.queen,
	'rook': pieceAttributesByType.rook,
	'bishop': pieceAttributesByType.bishop,
	'knight': pieceAttributesByType.knight,
	'pawn': pieceAttributesByType.pawn,
}

export const defaultSetupWhite = {
	// Hash by ranks white POV
	// Nest by file
	0: { 
		0:{pieceColor: 'black', pieceType: 'rook', eligibleMoves: {}, hasMoved:false},
		1:{pieceColor: 'black', pieceType: 'knight', eligibleMoves: {}},
		2:{pieceColor: 'black', pieceType: 'bishop', eligibleMoves: {}},
		3:{pieceColor: 'black', pieceType: 'queen', eligibleMoves: {}},
		4:{pieceColor: 'black', pieceType: 'king', eligibleMoves: {}, hasMoved:false, inCheck: false},
		5:{pieceColor: 'black', pieceType: 'bishop', eligibleMoves: {}},
		6:{pieceColor: 'black', pieceType: 'knight', eligibleMoves: {}},
		7:{pieceColor: 'black', pieceType: 'rook', eligibleMoves: {}, hasMoved:false} 
	}, 1: { 
		0:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		1:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		2:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		3:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		4:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		5:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		6:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		7:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false} 
	}, 6: { 
		0:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		1:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		2:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		3:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		4:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		5:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		6:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		7:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false} 
	}, 7: { 
		0:{pieceColor: 'white', pieceType: 'rook', eligibleMoves: {}, hasMoved:false},
		1:{pieceColor: 'white', pieceType: 'knight', eligibleMoves: {}},
		2:{pieceColor: 'white', pieceType: 'bishop', eligibleMoves: {}},
		3:{pieceColor: 'white', pieceType: 'queen', eligibleMoves: {}},
		4:{pieceColor: 'white', pieceType: 'king', eligibleMoves: {}, hasMoved:false, inCheck: false},
		5:{pieceColor: 'white', pieceType: 'bishop', eligibleMoves: {}},
		6:{pieceColor: 'white', pieceType: 'knight', eligibleMoves: {}},
		7:{pieceColor: 'white', pieceType: 'rook', eligibleMoves: {}, hasMoved:false} 
	}
}
export const defaultSetupBlack = {
	// Hash by ranks black POV
	0: { 
		0:{pieceColor: 'white', pieceType: 'rook', eligibleMoves: {}, hasMoved:false},
		1:{pieceColor: 'white', pieceType: 'knight', eligibleMoves: {}},
		2:{pieceColor: 'white', pieceType: 'bishop', eligibleMoves: {}},
		3:{pieceColor: 'white', pieceType: 'queen', eligibleMoves: {}},
		4:{pieceColor: 'white', pieceType: 'king', eligibleMoves: {}, hasMoved:false, inCheck: false},
		5:{pieceColor: 'white', pieceType: 'bishop', eligibleMoves: {}},
		6:{pieceColor: 'white', pieceType: 'knight', eligibleMoves: {}},
		7:{pieceColor: 'white', pieceType: 'rook', eligibleMoves: {}, hasMoved:false} 
	}, 1: { 
		0:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		1:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		2:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		3:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		4:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		5:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		6:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		7:{pieceColor: 'white', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false} 
	}, 6: { 
		0:{pieceColor: 'black', pieceType: 'rook', eligibleMoves: {}, hasMoved:false},
		1:{pieceColor: 'black', pieceType: 'knight', eligibleMoves: {}},
		2:{pieceColor: 'black', pieceType: 'bishop', eligibleMoves: {}},
		3:{pieceColor: 'black', pieceType: 'queen', eligibleMoves: {}},
		4:{pieceColor: 'black', pieceType: 'king', eligibleMoves: {}, hasMoved:false, inCheck: false},
		5:{pieceColor: 'black', pieceType: 'bishop', eligibleMoves: {}},
		6:{pieceColor: 'black', pieceType: 'knight', eligibleMoves: {}},
		7:{pieceColor: 'black', pieceType: 'rook', eligibleMoves: {}, hasMoved:false} 
	}, 7: { 
		0:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		1:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		2:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		3:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		4:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		5:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		6:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false},
		7:{pieceColor: 'black', pieceType: 'pawn', eligibleMoves: {}, hasMoved:false} 
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
