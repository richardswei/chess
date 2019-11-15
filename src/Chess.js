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
		}
	}

	handleNewGame() {
	}

	handleLoadGame() {
	}

	getEligibleMoves(piece) {
		console.log(piece)
		if (!piece.chesspiece) return false; 
		const currentPosition = piece.coordinate;
		const unitMoves = piece.unitMoves;
		// first check for any directions that don't immediately go off-board
		const newCoordinates = unitMoves.map((deltaCoord) => {
			const negativeIfWhite = piece.pieceColor==='white' ? -1 : 1;  
			return [(currentPosition[0]+negativeIfWhite*deltaCoord[0]), (currentPosition[1]+negativeIfWhite*deltaCoord[1])] 
		});
		const eligibleUnitMoves = newCoordinates.filter((coord) => {
			// eliminate off-board coords
			if (coord[0]<0 || coord[0]>7 || coord[1]<0 || coord[1]>7) {return false}
			// see if occupant exists in space 
			const occupant = chessHelpers.findPieceAt(coord[1], coord[0], piece.boardSetup);
			const occupantColor = occupant ? occupant[0] : null;
			return (occupantColor===piece.pieceColor) ? false : true;
		})
		if (!piece.unlimitedRange) {
		// if piece does not have unlimited range
			return eligibleUnitMoves;
		}	else {
			if (eligibleUnitMoves.length===0) return null;
			// take the eligible unit moves
			const eligibleDeltas = eligibleUnitMoves.map((coord)=>{
				return [coord[0]-currentPosition[0], coord[1]-currentPosition[1]]
			});
			const movesUnlimitedRange = eligibleDeltas.map((deltaCoord)=>{
				return this.extendForUnlimitedRange(piece, currentPosition, deltaCoord)
			});
			return movesUnlimitedRange.flat()
		}
	}

	extendForUnlimitedRange(piece, currentPosition, deltaMovement, eligibleMoves=[]) {
		const dx=deltaMovement[0];
		const dy=deltaMovement[1];
		const newCoord = [currentPosition[0]+dx, currentPosition[1]+dy]
		// check if offBoard
		const coordinateIsOffBoard = newCoord[0]<0 || newCoord[0]>7 || newCoord[1]<0 || newCoord[1]>7
		if (coordinateIsOffBoard) {
			return eligibleMoves
		}
		// see if occupant exists in space 
		const occupant = chessHelpers.findPieceAt(newCoord[1], newCoord[0], piece.boardSetup);
		const occupantColor = occupant ? occupant[0] : null;
		if (occupantColor===piece.pieceColor) {
			return eligibleMoves;
		} else if (occupantColor && occupantColor!==piece.pieceColor) {
			eligibleMoves.push(newCoord);
			return eligibleMoves;
		}
		// if we get to this point we have an eligible coord
		// push and recurse
		eligibleMoves.push(newCoord);
		return this.extendForUnlimitedRange(piece, newCoord, deltaMovement, eligibleMoves)
	}

	handleSquareClick(props) {
		let moves = this.getEligibleMoves(props)	
		if (!this.state.hotSquare){
			this.setState((state) => ({
				highlightedSquares: moves ? this.groupByRank(moves) : {},
				hotSquare: props.coordinate
			}))
		} else {
			console.log('pre-executeion')
			console.log(props)
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

	executeMove(boardSetup, highlightedSquares, coordinate, hotSquare) {
		console.log('attempting to executeMove')
		console.log('coordinate:'+coordinate+', hotSquare:'+hotSquare )
		if (this.treeHasCoordinate(highlightedSquares, coordinate)) {
			/*access boardSetup, pull the item from the hotSquare, overwrite boardSetup at the keys*/
			const copyBoardSetup = JSON.parse(JSON.stringify(boardSetup))
			console.log(copyBoardSetup)
			// move piece
			if (!copyBoardSetup[coordinate[1]]){
				copyBoardSetup[coordinate[1]]={}
			}
			copyBoardSetup[coordinate[1]][coordinate[0]]=copyBoardSetup[hotSquare[1]][hotSquare[0]];
			copyBoardSetup[hotSquare[1]][hotSquare[0]]=null;
			this.setState({boardSetup: copyBoardSetup});
		} else {
			return
		}

	}

	treeHasCoordinate(tree, coordinate) {
		try {
			const coordInTree = tree[coordinate[1]][coordinate[0]];
			return coordInTree
		} catch {
			return false
		}
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
			highlighted={this.getHighlightedStatus(this.props.highlightedSquares, rank, file)}
			coordinate={[file,rank]}
			symbol = {this.getPieceSymbol(piece)}
			chesspiece={piece}
			{...this.props}
			pieceColor = {piece ? piece[0] : null}
			{...this.getPieceAttributes(piece)}
		></Square>
	}

	getPieceAttributes(currentChesspiece) {
		try {
			return chessHelpers.pieceAttributes[currentChesspiece[1]]
		} catch {
			return {}
		}
	}
	getPieceSymbol(currentChesspiece) {
		const pieceColor = currentChesspiece ? currentChesspiece[0] : null;
		const pieceType = currentChesspiece ? currentChesspiece[1] : null;
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
		const pieces = this.props.boardSetup;
		const boardRows = Array(8).fill(1).map((_, i) => i);
		const boardCols = Array(8).fill(1).map((_, i) => i);
		return pieces && <div>
			{
				boardRows.map((row) => {
					return <div className="boardRow" key={row}>
						{
							boardCols.map((column) => {
								const rank = row;
								const file = column;
								const squareId = row*8+file;
								const piece=chessHelpers.findPieceAt(rank, file, pieces);
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