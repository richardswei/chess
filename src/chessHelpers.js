const defaultSetupWhite = {
	// Hash by ranks white POV
	// Nest by file
	0: { 0:'black-rook',1:'black-knight',2:'black-bishop',3:'black-queen',4:'black-king',5:'black-bishop',6:'black-knight',7:'black-rook' },
	1: { 0:'black-pawn',1:'black-pawn',2:'black-pawn',3:'black-pawn',4:'black-pawn',5:'black-pawn',6:'black-pawn',7:'black-pawn' },
	6: { 0:'white-pawn',1:'white-pawn',2:'white-pawn',3:'white-pawn',4:'white-pawn',5:'white-pawn',6:'white-pawn',7:'white-pawn' },
	7: { 0:'white-rook',1:'white-knight',2:'white-bishop',3:'white-queen',4:'white-king',5:'white-bishop',6:'white-knight',7:'white-rook' },
}
const defaultSetupBlack = {
	// Hash by ranks black POV
	0: { 0:'white-rook',1:'white-knight',2:'white-bishop',3:'white-king',4:'white-queen',5:'white-bishop',6:'white-knight',7:'white-rook' },
	1: { 0:'white-pawn',1:'white-pawn',2:'white-pawn',3:'white-pawn',4:'white-pawn',5:'white-pawn',6:'white-pawn',7:'white-pawn' },
	6: { 0:'black-pawn',1:'black-pawn',2:'black-pawn',3:'black-pawn',4:'black-pawn',5:'black-pawn',6:'black-pawn',7:'black-pawn' },
	7: { 0:'black-rook',1:'black-knight',2:'black-bishop',3:'black-king',4:'black-queen',5:'black-bishop',6:'black-knight',7:'black-rook' },
}

const chess_unicode = {
	'white-king': '\u2654',
	'white-queen': '\u2655',
	'white-rook': '\u2656',
	'white-bishop': '\u2657',
	'white-knight': '\u2658',
	'white-pawn': '\u2659',
	'black-king': '\u265A',
	'black-queen': '\u265B',
	'black-rook': '\u265C',
	'black-bishop': '\u265D',
	'black-knight': '\u265E',
	'black-pawn': '\u265F',
}


const pieceAttributesByType = {
	// moves in form of [dx, dy]
	king: {
		unlimitedRange: false,
		moveset: [[0,1],[0,-1],[-1,0],[1,0],[1,1],[-1,-1],[-1,1],[1,-1]],
		hasMoved: false,
		inCheck: false
	},
	queen: {
		unlimitedRange: true,
		moveset: [[0,1],[0,-1],[-1,0],[1,0],[1,1],[-1,-1],[-1,1],[1,-1]],
	},
	rook: {
		unlimitedRange: true,
		moveset: [[0,1],[0,-1],[-1,0],[1,0]],
		hasMoved: false
	},
	bishop: {
		unlimitedRange: true,
		moveset: [[1,1],[-1,-1],[-1,1],[1,-1]],
	},
	knight: {
		unlimitedRange: false,
		moveset: [[3,2],[-3,-2],[3,-2],[-3,2],[2,3],[-2,-3],[2,-3],[-2,3]],
	},
	pawn: {
		unlimitedRange: false,
		moveset: [0,1],
		captureMoveset: [], 
		hasMoved: false
	}
}

const pieceAttributes = {
	'white-king': pieceAttributesByType.king,
	'white-queen': pieceAttributesByType.queen,
	'white-rook': pieceAttributesByType.rook,
	'white-bishop': pieceAttributesByType.bishop,
	'white-knight': pieceAttributesByType.knight,
	'white-pawn': pieceAttributesByType.pawn,
	'black-king': pieceAttributesByType.king,
	'black-queen': pieceAttributesByType.queen,
	'black-rook': pieceAttributesByType.rook,
	'black-bishop': pieceAttributesByType.bishop,
	'black-knight': pieceAttributesByType.knight,
	'black-pawn': pieceAttributesByType.pawn,
}

module.exports = {
	defaultSetupWhite: defaultSetupWhite,
	defaultSetupBlack: defaultSetupBlack,
	chess_unicode: chess_unicode,
	pieceAttributes: pieceAttributes,
}