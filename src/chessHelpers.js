

export function findPieceAt(rank, file, piecesObject) {
	try {
		return piecesObject[rank][file]
	} 
	catch(error) {
		// console.log(`No piece at (${rank},${file})`)
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
		type: 'king',
		unlimitedRange: false,
		unitMoves: [[0,1],[0,-1],[-1,0],[1,0],[1,1],[-1,-1],[-1,1],[1,-1]],
		hasMoved: false,
		inCheck: false
	},
	queen: {
		type: 'queen',
		unlimitedRange: true,
		unitMoves: [[0,1],[0,-1],[-1,0],[1,0],[1,1],[-1,-1],[-1,1],[1,-1]],
	},
	rook: {
		type: 'rook',
		unlimitedRange: true,
		unitMoves: [[0,1],[0,-1],[-1,0],[1,0]],
		hasMoved: false
	},
	bishop: {
		type: 'bishop',
		unlimitedRange: true,
		unitMoves: [[1,1],[-1,-1],[-1,1],[1,-1]],
	},
	knight: {
		type: 'knight',
		unlimitedRange: false,
		unitMoves: [[1,2],[-1,-2],[1,-2],[-1,2],[2,1],[-2,-1],[2,-1],[-2,1]],
	},
	pawn: {
		type: 'pawn',
		unlimitedRange: false,
		unitMoves: [[0,1]],
		captureMoveset: [], 
		hasMoved: false
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
		0:['black','rook'],
		1:['black','knight'],
		2:['black','bishop'],
		3:['black','queen'],
		4:['black','king'],
		5:['black','bishop'],
		6:['black','knight'],
		7:['black','rook'] 
	}, 1: { 
		0:['black','pawn'],
		1:['black','pawn'],
		2:['black','pawn'],
		3:['black','pawn'],
		4:['black','pawn'],
		5:['black','pawn'],
		6:['black','pawn'],
		7:['black','pawn'] 
	}, 6: { 
		0:['white','pawn'],
		1:['white','pawn'],
		2:['white','pawn'],
		/*3:['white','pawn'],*/
		4:['white','pawn'],
		5:['white','pawn'],
		6:['white','pawn'],
		7:['white','pawn'] 
	}, 7: { 
		0:['white','rook'],
		1:['white','knight'],
		2:['white','bishop'],
		3:['white','queen'],
		4:['white','king'],
		5:['white','bishop'],
		6:['white','knight'],
		7:['white','rook'] 
	}
}
export const defaultSetupBlack = {
	// Hash by ranks black POV
	0: { 
		0:['white','rook'],
		1:['white','knight'],
		2:['white','bishop'],
		3:['white','king'],
		4:['white','queen'],
		5:['white','bishop'],
		6:['white','knight'],
		7:['white','rook'] 
	}, 1: { 
		0:['white','pawn'],
		1:['white','pawn'],
		2:['white','pawn'],
		3:['white','pawn'],
		4:['white','pawn'],
		5:['white','pawn'],
		6:['white','pawn'],
		7:['white','pawn'] 
	}, 6: { 
		0:['black','pawn'],
		1:['black','pawn'],
		2:['black','pawn'],
		3:['black','pawn'],
		4:['black','pawn'],
		5:['black','pawn'],
		6:['black','pawn'],
		7:['black','pawn'] 
	}, 7: { 
		0:['black','rook'],
		1:['black','knight'],
		2:['black','bishop'],
		3:['black','king'],
		4:['black','queen'],
		5:['black','bishop'],
		6:['black','knight'],
		7:['black','rook'] 
	}
}
