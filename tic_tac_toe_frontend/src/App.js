import React, { useMemo, useState } from "react";
import "./App.css";

/**
 * Returns the winner and the winning line (if any).
 * Line is an array of board indices (0..8).
 */
function calculateWinner(squares) {
  const lines = [
    // Rows
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    // Columns
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    // Diagonals
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }

  return { winner: null, line: null };
}

function isBoardFull(squares) {
  return squares.every((v) => v !== null);
}

// PUBLIC_INTERFACE
function Square({ value, onClick, isWinning, disabled, index }) {
  /** This is a public component for a single Tic Tac Toe square button. */
  const label = value ? `Square ${index + 1}: ${value}` : `Square ${index + 1}: empty`;

  return (
    <button
      type="button"
      className={`ttt-square ${isWinning ? "is-winning" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <span className="ttt-squareValue" aria-hidden="true">
        {value}
      </span>
    </button>
  );
}

// PUBLIC_INTERFACE
function Board({ squares, onPlay, winningLine, isGameOver }) {
  /** This is a public component for the 3x3 Tic Tac Toe board. */
  return (
    <div className="ttt-board" role="grid" aria-label="Tic Tac Toe board">
      {squares.map((value, idx) => (
        <Square
          key={idx}
          index={idx}
          value={value}
          isWinning={Boolean(winningLine?.includes(idx))}
          disabled={isGameOver || value !== null}
          onClick={() => onPlay(idx)}
        />
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Main entrypoint component for the Tic Tac Toe game UI. */
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const result = useMemo(() => calculateWinner(squares), [squares]);
  const winner = result.winner;
  const winningLine = result.line;

  const isDraw = !winner && isBoardFull(squares);
  const isGameOver = Boolean(winner) || isDraw;

  const statusText = useMemo(() => {
    if (winner) return `Winner: ${winner}`;
    if (isDraw) return "Draw game";
    return `Next player: ${xIsNext ? "X" : "O"}`;
  }, [winner, isDraw, xIsNext]);

  // PUBLIC_INTERFACE
  const handlePlay = (index) => {
    /** Handles a user move by placing the current player's mark in the selected square. */
    if (isGameOver) return;
    if (squares[index] !== null) return;

    const nextSquares = squares.slice();
    nextSquares[index] = xIsNext ? "X" : "O";

    setSquares(nextSquares);
    setXIsNext((prev) => !prev);
  };

  // PUBLIC_INTERFACE
  const handleRestart = () => {
    /** Resets the board and sets the next player to X. */
    setSquares(Array(9).fill(null));
    setXIsNext(true);
  };

  return (
    <div className="App">
      <main className="ttt-page">
        <section className="ttt-card" aria-label="Tic Tac Toe game">
          <header className="ttt-header">
            <h1 className="ttt-title">Tic Tac Toe</h1>
            <p className="ttt-subtitle">A simple 3×3 game — take turns and win with a line of three.</p>
          </header>

          <div className="ttt-statusRow">
            <div
              className={`ttt-status ${winner ? "is-winner" : ""} ${isDraw ? "is-draw" : ""}`}
              role="status"
              aria-live="polite"
            >
              <span className="ttt-statusDot" aria-hidden="true" />
              <span className="ttt-statusText">{statusText}</span>
            </div>
          </div>

          <Board
            squares={squares}
            onPlay={handlePlay}
            winningLine={winningLine}
            isGameOver={isGameOver}
          />

          <footer className="ttt-footer">
            <button type="button" className="ttt-restartBtn" onClick={handleRestart} aria-label="Restart game">
              Restart
            </button>
            <p className="ttt-hint">
              Tip: Use your mouse or touch to play. Winning squares are highlighted.
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
