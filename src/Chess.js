import React, {Component} from 'react';
import './chess.css';
const chessHelpers = require('./chessHelpers.js');

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
			piece={piece}
		></Square>
	}
	
	findPieceAt(rank, file, piecesObject) {
		const rankPieces = piecesObject[rank]
		const filePieces = rankPieces ? piecesObject[rank][file] : null
		return filePieces
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
								const piece=this.findPieceAt(rank, file, pieces);
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
	// renderPiece(piece) {
	// 	return <Piece></Piece>
	// }

	render() {
		return <button className={`square square-${this.props.color}`}>
			<Piece
				chesspiece={this.props.piece}
			></Piece>
		</button>
	}

}

class Piece extends Component {
	render() {
		return <div>
			{chessHelpers.chess_unicode[this.props.chesspiece]}
		</div>
	}
}




class Player extends Component {

}

export default Chess;