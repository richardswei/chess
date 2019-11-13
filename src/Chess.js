import React, {Component} from 'react';
import './chess.css';
import * as chessHelpers from './chessHelpers.js'

class Chess extends Component {
	constructor(props) {
		super(props);
		this.handleNewGame = this.handleNewGame.bind(this);
		this.handleLoadGame = this.handleLoadGame.bind(this);
		this.state = {
			pieces: chessHelpers.defaultSetupWhite /*an array of coordinate-piece objects*/
		}
	}

	componentDidMount() {
	}
	
	handleNewGame() {
	}

	handleLoadGame() {
	}

	render() {
		console.log(this.state.pieces)
		return this.state.pieces && <Board className="board"
			pieces = {this.state.pieces}
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
			pieceID={null}
			rank={rank}
			file={file}
			chesspiece={piece}
			boardSetup={this.props.pieces}
		></Square>
	}

	render() {
		const pieces = this.props.pieces;
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
	// renderPiece(chesspiece) {
	// 	return <Piece></Piece>
	// }

	render() {
		const currentChesspiece = this.props.chesspiece;
		const pieceColor = currentChesspiece ? currentChesspiece[0] : null;
		const pieceType = currentChesspiece ? currentChesspiece[1] : null;
		return <button className={`square square-${this.props.color}`}>
			{currentChesspiece && <Piece
				symbol={chessHelpers.chess_unicode[pieceColor][pieceType]}
				color={pieceColor}
				boardSetup={this.props.boardSetup}
				coordinate={[this.props.file,this.props.rank]}
				{...chessHelpers.pieceAttributes[pieceType]}
			></Piece>}
		</button>
	}

}

class Piece extends Component {
	getEligibleMoves(piece) {
		const currentPosition = piece.coordinate;
		const unitMoves = piece.unitMoves;
		// first check for any directions that don't immediately go off-board
		const newCoordinates = unitMoves.map((deltaCoord) => {
			const negativeIfWhite = piece.color==='white' ? -1 : 1;  
			return [(currentPosition[0]+negativeIfWhite*deltaCoord[0]), (currentPosition[1]+negativeIfWhite*deltaCoord[1])] 
		});
		const eligibleUnitMoves = newCoordinates.filter((coord) => {
			// eliminate off-board coords
			if (coord[0]<0 || coord[0]>7 || coord[1]<0 || coord[1]>7) {return false}
			// see if occupant exists in space 
			const occupant = chessHelpers.findPieceAt(coord[1], coord[0], piece.boardSetup);
			const occupantColor = occupant ? occupant[0] : null;
			return (occupantColor===piece.color) ? false : true;
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
				const allMovesForDelta = this.extendForUnlimitedRange(piece, currentPosition, deltaCoord)
				console.log(allMovesForDelta)
				return allMovesForDelta
			});
		}
	}

	extendForUnlimitedRange(piece, currentPosition, deltaMovement, eligibleMoves=[]) {
		const dx=deltaMovement[0];
		const dy=deltaMovement[1];
		const newCoord = [currentPosition[0]+dx, currentPosition[1]+dy]
		// check if valid
		// eliminate off-board coords
		if (newCoord[0]<0 || newCoord[0]>7 || newCoord[1]<0 || newCoord[1]>7) {return eligibleMoves}
		// see if occupant exists in space 
		const occupant = chessHelpers.findPieceAt(newCoord[1], newCoord[0], piece.boardSetup);
		const occupantColor = occupant ? occupant[0] : null;
		if (occupantColor===piece.color) {
			return eligibleMoves;
		} else if (occupantColor && occupantColor !==piece.color) {
			eligibleMoves.push(newCoord)
			return eligibleMoves;
		}
		// if we get to this point we have an eligible coord
		// push and recurse
		eligibleMoves.push(newCoord);
		return this.extendForUnlimitedRange(piece, newCoord, deltaMovement, eligibleMoves)
	}

	render() {
		if (this.props.type==='queen') {
			let moves = this.getEligibleMoves(this.props)

		}
		return <div>
			{this.props.symbol}
		</div>
	}
}

class Player extends Component {

}



export default Chess;