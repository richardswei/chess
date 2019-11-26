import React, {Component} from 'react';
import './chess.css';
import * as chessHelpers from './chessHelpers.js'
import Button from 'react-bootstrap/Button';
import {Jumbotron, ListGroup, Container, Row, Col} from 'react-bootstrap';


class Game extends Component {
  constructor(props) {
    super(props);
    this.handleNewGame = this.handleNewGame.bind(this);
    this.handleLoadGame = this.handleLoadGame.bind(this);
    this.handleSquareClick = this.handleSquareClick.bind(this);
    this.handleHistoryClick = this.handleHistoryClick.bind(this);
    this.state = chessHelpers.defaultState
  }
  componentDidMount() {
    // saveAllPossibleMoves
    const copyBoardSetup = JSON.parse(JSON.stringify(this.state.boardSetup))
    const boardWithMoves = chessHelpers.updateBoardWithMoves(copyBoardSetup, {})
    this.setState({
      boardSetup: boardWithMoves,
    });
  }

  handleNewGame() {
  }

  handleLoadGame() {
  }

  handleHistoryClick(props, index) {
    if (index===0) {
      this.setState(chessHelpers.defaultState);
    } else {
      this.setState(props.history[index]);
    }
  }

  handleSquareClick(props) {
    console.log(this.state)
    if (!this.state.hotSquare){
      // if a square has not been focused, focus it 
      const square = chessHelpers.getValueAtSquare(props.coordinate[1], props.coordinate[0], this.state.boardSetup);
      if (square) {
        this.setState((state) => ({
        highlightedSquares: square.pieceColor === props.playerTurn ? chessHelpers.groupByRank(square.eligibleMovesList) : {},
        hotSquare: props.coordinate
      }))}
    } else {
      // otherwise we execute the move
      this.executeMove(this.state.boardSetup, this.state.highlightedSquares, props.coordinate, this.state.hotSquare )
      this.setState((state) => ({
        highlightedSquares: {},
        hotSquare: null
      }))
    }
  }
  
  executeMove(boardSetup, highlightedSquares, targetSquare, hotSquare) {
    const currentPlayer = this.state.playerTurn;
    const originRank = hotSquare[1];
    const originFile = hotSquare[0];
    const valueOrigin = chessHelpers.getValueAtSquare(originRank, originFile, boardSetup);
    if (!valueOrigin) return false;
    if (valueOrigin.pieceColor!==currentPlayer) return false; 
    const targetRank = targetSquare[1];
    const targetFile = targetSquare[0];
    const opponent = currentPlayer==="white"? "black" : "white";

    if (chessHelpers.getValueAtSquare(targetRank, targetFile, highlightedSquares)) {
      /*access boardSetup, pull the item from the hotSquare, overwrite boardSetup at the keys*/
      let copyBoardSetup = JSON.parse(JSON.stringify(boardSetup))

      // move piece from origin to target. set the hasMoved property to true
      copyBoardSetup[originRank][originFile].hasMoved=true
      // make sure key exists
      if (!copyBoardSetup[targetRank]){
        copyBoardSetup[targetRank]={}
      }
      copyBoardSetup[targetRank][targetFile]=copyBoardSetup[originRank][originFile];
      copyBoardSetup[originRank][originFile]=null;

      // resolveboard
      let newStateObject = {};
      newStateObject.enPassantAvailableAt = this.state.enPassantAvailableAt;
      newStateObject.whiteKingPosition = this.state.whiteKingPosition;
      newStateObject.blackKingPosition = this.state.blackKingPosition;
      const movingPiece = copyBoardSetup[targetRank][targetFile]
      newStateObject.lastMove = `${movingPiece.pieceColor}: ${movingPiece.pieceType} to ${chessHelpers.fileCoordinates[targetSquare[0]]}${targetSquare[1]+1}`;

      copyBoardSetup = chessHelpers.manageSpecialMoves(movingPiece, hotSquare, targetSquare, copyBoardSetup, newStateObject)
      newStateObject = chessHelpers.manageEnPassantState(movingPiece, hotSquare, targetSquare, newStateObject);
      newStateObject = chessHelpers.manageKingMove(movingPiece, targetSquare, newStateObject);
      let boardSetupUpdated = chessHelpers.updateBoardWithMoves(copyBoardSetup, newStateObject);      

      //  Resolve board and look for any to player's king
      // make sure player did not move into check
      let playerKingPosition = currentPlayer+"KingPosition";
      const playerIsChecked = 
        chessHelpers.searchForChecks(currentPlayer, newStateObject[playerKingPosition], boardSetupUpdated);
      if (this.state.check && playerIsChecked) {
        alert('You will still be in check!')
        return;
      } else if (playerIsChecked) {
        alert('You cannot move into check!')
        return;
      };

      newStateObject.jumbotronMessage = `${opponent.toUpperCase()}'s Move`

      // see if a check has occurred against opponent
      const opponentKingPosition = opponent+"KingPosition";
      const threatenedSpaces = chessHelpers.getThreatsAgainstPlayer(boardSetupUpdated, opponent);
      boardSetupUpdated = chessHelpers.updateOpponentKingMoves(boardSetupUpdated, threatenedSpaces, opponent)
      

      // look for a checkmate
      // look for a stalemate
      const legalMovesExist = chessHelpers.eligibleMovesExist(opponent, boardSetupUpdated, newStateObject)
      const checkedKingExists = chessHelpers.searchForChecks(opponent, newStateObject[opponentKingPosition], boardSetupUpdated);
      if (checkedKingExists && !legalMovesExist) {
        alert(`${opponent.toUpperCase()} has been checkmated!`);
        newStateObject.jumbotronMessage = `${opponent.toUpperCase()} has been checkmated!`
      } else if (!legalMovesExist) {
        alert(`Game ends in a stalemate!`);
        newStateObject.jumbotronMessage = `Game ends in a stalemate!`
      } else if (checkedKingExists) {
        newStateObject.check = true;
        alert(`${opponent.toUpperCase()} is checked!`);
        newStateObject.jumbotronMessage = newStateObject.jumbotronMessage+"-(in check)"
      } else {
        newStateObject.check = false;
      }
      

      // set state if all has passed
      this.setState({
        history: this.state.history.concat(this.state),
        boardSetup: boardSetupUpdated,
        playerTurn: opponent,
        threatenedSpaces: threatenedSpaces,
        ...newStateObject
      });
    } else {
      return
    }
  }

  render() {
    return this.state && 
    <div>
      <Jumbotron fluid >
        <h1>Chess</h1>
      </Jumbotron>
      <br/>
      <Container>
        <Row>
        </Row>
        <Row>
          <PlayerMove 
            jumbotronMessage={this.state.jumbotronMessage}
          ></PlayerMove>
        </Row>
        <Row>
          <Col className="chessboard" xs={12} md={8}>
              <Board className="board"
                handleSquareClick={this.handleSquareClick}
                {...this.state}
              ></Board>
            </Col>
            <Col className="moveHistory" xs={6} md={4}>
              <History
                handleHistoryClick={this.handleHistoryClick}
                lastMove={this.state.lastMove}
                history={this.state.history}
              ></History>
          </Col>
        </Row>
      </Container>
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
        )%2===0 ? "black" : "white"}
      highlighted={chessHelpers.getValueAtSquare(rank, file, this.props.highlightedSquares)}
      coordinate={[file,rank]}
      symbol = {this.getPieceSymbol(piece)}
      {...this.props}
      // {...this.getPieceAttributes(piece)}
    ></Square>
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

  buildBoard(boardSetup, blackOnTop, boardRows, boardCols) {
    const rows = blackOnTop ? [...boardRows].reverse() : boardRows;
    const columns = blackOnTop ? boardCols : [...boardCols].reverse();
    if (boardSetup) {
      const boardDisplay = <div>
        <div className="boardRow">
          {chessHelpers.fileCoordinates.map((letter) =>  
          <label className="fileLabel">{letter}</label>)}
        </div>
        {rows.map((row, index) => {
                  return <div className="boardRow" key={row}>  
                    <span>{row+1}</span>
                    {
                      columns.map((column) => {
                        const rank = row;
                        const file = column;
                        const squareId = row*8+file;
                        const piece=chessHelpers.getValueAtSquare(rank, file, boardSetup);
                        return this.renderSquare(squareId, rank, file, piece)
                      })
                    }
                  </div>
                })}
      </div>
      return <div>{boardDisplay}</div>
    }
  }

  render() {
    const boardSetup = this.props.boardSetup;
    const blackOnTop = this.props.blackOnTop;
    const boardRows = Array(8).fill(1).map((_, i) => i);
    const boardCols = Array(8).fill(1).map((_, i) => i);
    return this.buildBoard(boardSetup, blackOnTop, boardRows, boardCols);
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

class PlayerMove extends Component {
  render() {
    return <div>
      <h5>{this.props.jumbotronMessage}</h5>
    </div>
  }
}

class History extends Component {
  render() {
    return <ListGroup>
      Move History
      {this.props.history && this.props.history.map((move, i) => {
        return <ListGroup.Item action
          key = {i}
          onClick={() => this.props.handleHistoryClick(this.props, i)}
          variant='dark'
          className='move'>
          {move.lastMove}
        </ListGroup.Item>
      })}
      <ListGroup.Item 
        variant='dark'
        className='move'>{this.props.lastMove}</ListGroup.Item>
    </ListGroup>
  }
}

export default Game;