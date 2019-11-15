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
			enPassantAvailableAt: [],
			positionsInCheck: {},
		}
	}

	handleNewGame() {
	}

	handleLoadGame() {
	}

	getEligibleMoves(piece) {
		if (!piece.symbol || piece.pieceColor!==piece.playerTurn) return false;
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
			// see if occupant of same color exists in new square 
			const occupant = chessHelpers.getValueAtSquare(coord[1], coord[0], piece.boardSetup);
			// return false for any of the following:
			if (occupant && piece.pieceType==="pawn") return false
			const occupantColor = occupant ? occupant.pieceColor : null;
			return (occupantColor===piece.pieceColor) ? false : true;
		})
		if (!piece.unlimitedRange) {
			const specialMoves = this.getPawnSpecialMoves(piece);
			// console.log(specialMoves)
			return eligibleUnitMoves.concat(specialMoves);
		}	else {
			if (eligibleUnitMoves.length===0) return null;
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
		const occupant = chessHelpers.getValueAtSquare(newCoord[1], newCoord[0], piece.boardSetup);
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

	
	getPawnSpecialMoves(piece) {
		// no need to check for offboard here; 
		// capture and doublestep moves restrict to board space
		// enpassant capture already restricted in state setter
		let validMoves = [];
		const negativeIfWhite = (piece.pieceColor==='white') ? -1 : 1
		if (piece.pieceType==='pawn') {
			const file = piece.coordinate[0];
			const rank = piece.coordinate[1];
			const captureCoordinates = chessHelpers.pawnSpecialMoves
				.diagonalCapture.map((move) => {
					const newX = move[0]+file;
					const newY = negativeIfWhite*move[1]+rank;
					return [newX, newY];
				});
			/*if boardSetup's captureCoordinates contain enemies, 
			then add capture coordinates*/
			const eligibleCapture = captureCoordinates.filter((coord) => {
				const colorAndPiece = chessHelpers.getValueAtSquare(coord[1], coord[0], piece.boardSetup)
				console.log(colorAndPiece)
				return colorAndPiece && colorAndPiece.pieceColor!==piece.playerTurn;
			})
			validMoves.push(...eligibleCapture);
			if (!piece.hasMoved) {
	/*	if pawn is on the second rank and no piece is two in front
			add double advancement coordinates */	
				const file = piece.coordinate[0];
				const rank = piece.coordinate[1];
				// if a piece is found at either 1 or 2 ranks forward, not valid
				const blocked = 
					chessHelpers.getValueAtSquare(rank+negativeIfWhite*2, file, piece.boardSetup) &&
					chessHelpers.getValueAtSquare(rank+negativeIfWhite*1, file, piece.boardSetup);
				if (!blocked) {
					validMoves.push([file, rank+negativeIfWhite*2])
				}
			}
			if (this.state.enPassantAvailableAt) {
				console.log('this.state.enPassantAvailableAt'+this.state.enPassantAvailableAt)
				const vulnerablePawnPosition = this.state.enPassantAvailableAt
				const enPassantMoves = this
					.getEnPassantEligibility(vulnerablePawnPosition[1], vulnerablePawnPosition[0])
				console.log(chessHelpers.getValueAtSquare(rank,file,enPassantMoves))
				if (chessHelpers.getValueAtSquare(rank,file,enPassantMoves)) {
					validMoves.push([vulnerablePawnPosition[0],vulnerablePawnPosition[1]+negativeIfWhite])
				}
			}
		}

		return validMoves;
	}

	executeMove(boardSetup, highlightedSquares, coordinate, hotSquare) {
		const rank = coordinate[1];
		const file = coordinate[0];
		if (chessHelpers.getValueAtSquare(rank, file, highlightedSquares)) {
			/*access boardSetup, pull the item from the hotSquare, overwrite boardSetup at the keys*/
			const copyBoardSetup = JSON.parse(JSON.stringify(boardSetup))
			// move piece
			if (!copyBoardSetup[rank]){
				copyBoardSetup[rank]={}
			}
			
			copyBoardSetup[hotSquare[1]][hotSquare[0]].hasMoved=true
			copyBoardSetup[rank][file]=copyBoardSetup[hotSquare[1]][hotSquare[0]];
			copyBoardSetup[hotSquare[1]][hotSquare[0]]=null;
			const movingPiece = copyBoardSetup[rank][file].pieceType
			// if enPassant was available and movingPiece is
			// a pawn that moved behind the pawn, then EP happened
			if (movingPiece==='pawn' && this.state) {
				if (this.state.enPassantAvailableAt[0]===file && this.state.enPassantAvailableAt[1]===hotSquare[1]){
					copyBoardSetup[hotSquare[1]][[file]]=null;
				}
				// if the pawn just did a doublestep it is vulnerable to en Passant during the next move
				if (Math.abs(rank-hotSquare[1])===2) {
					this.setState({enPassantAvailableAt: [file,rank]})
				} else {
					// clear en Passant eligibility
					this.setState({enPassantAvailableAt: [null, null]})
				}
			} else {
				this.setState({enPassantAvailableAt: [null, null]})
			}
			this.setState({
				boardSetup: copyBoardSetup,
				playerTurn: this.state.playerTurn==="white" ? "black" : "white"
			});
		} else {
			return
		}
	}

	getEnPassantEligibility(rank, file) {
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
			highlighted={this.getHighlightedStatus(this.props.highlightedSquares, rank, file)}
			coordinate={[file,rank]}
			symbol = {this.getPieceSymbol(piece)}
			{...piece}
			{...this.props}
			{...this.getPieceAttributes(piece)}
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