import React, { useEffect, useMemo, useState } from "react";
import { getAiMove, getGameOutcome } from "./ai/minimax";

function Square({ value, onClick, disabled }) {
  return (
    <button
      className="square"
      onClick={onClick}
      disabled={disabled}
      aria-label={value ? `Square ${value}` : "Empty square"}
    >
      {value}
    </button>
  );
}

function Board({ squares, onPlay, disabled }) {
  return (
    <div className="board" role="grid" aria-label="Tic Tac Toe Board">
      {squares.map((v, idx) => (
        <Square
          key={idx}
          value={v}
          disabled={disabled || v != null}
          onClick={() => onPlay(idx)}
        />
      ))}
    </div>
  );
}

function nextPlayer(p) {
  return p === "X" ? "O" : "X";
}

function emptyBoard() {
  return Array(9).fill(null);
}

function computeStatus({
  mode,
  aiThinking,
  outcome,
  xIsNext,
  humanPlayer,
  aiPlayer
}) {
  if (outcome.winner) return `Winner: ${outcome.winner}`;
  if (outcome.isDraw) return "It's a draw";

  if (mode === "HUMAN_AI") {
    const current = xIsNext ? "X" : "O";
    if (aiThinking) return "AI is thinking…";
    if (current === humanPlayer) return `Your turn (${humanPlayer})`;
    return `AI's turn (${aiPlayer})`;
  }

  return `Next player: ${xIsNext ? "X" : "O"}`;
}

export default function App() {
  const [squares, setSquares] = useState(() => emptyBoard());
  const [xIsNext, setXIsNext] = useState(true);

  const [mode, setMode] = useState("HUMAN_HUMAN"); // "HUMAN_HUMAN" | "HUMAN_AI"
  const [humanPlayer, setHumanPlayer] = useState("X"); // "X" | "O"
  const [difficulty, setDifficulty] = useState("Medium"); // "Easy" | "Medium" | "Hard"
  const [aiThinking, setAiThinking] = useState(false);

  const aiPlayer = useMemo(() => (humanPlayer === "X" ? "O" : "X"), [humanPlayer]);

  const outcome = useMemo(() => getGameOutcome(squares), [squares]);

  const status = useMemo(
    () =>
      computeStatus({
        mode,
        aiThinking,
        outcome,
        xIsNext,
        humanPlayer,
        aiPlayer
      }),
    [mode, aiThinking, outcome, xIsNext, humanPlayer, aiPlayer]
  );

  const currentPlayer = xIsNext ? "X" : "O";
  const gameOver = outcome.winner != null || outcome.isDraw;

  const boardDisabled = gameOver || (mode === "HUMAN_AI" && (aiThinking || currentPlayer === aiPlayer));

  function resetBoardOnly() {
    setSquares(emptyBoard());
    setXIsNext(true);
    setAiThinking(false);
  }

  function handlePlay(index) {
    if (boardDisabled) return;

    // In Human vs AI mode, only allow human to click during their turn.
    if (mode === "HUMAN_AI" && currentPlayer !== humanPlayer) return;

    if (squares[index] != null) return;
    if (gameOver) return;

    const nextSquares = squares.slice();
    nextSquares[index] = currentPlayer;

    setSquares(nextSquares);
    setXIsNext(!xIsNext);
  }

  // AI move effect: whenever it's AI's turn and game not over, make an AI move.
  useEffect(() => {
    if (mode !== "HUMAN_AI") return;
    if (gameOver) return;

    const current = xIsNext ? "X" : "O";
    if (current !== aiPlayer) return;

    let cancelled = false;
    setAiThinking(true);

    // Defer computation slightly so UI can paint "thinking…" and remain responsive.
    const t = window.setTimeout(() => {
      if (cancelled) return;

      const move = getAiMove(squares, aiPlayer, humanPlayer, difficulty);
      if (move == null) {
        setAiThinking(false);
        return;
      }

      setSquares((prev) => {
        // Guard against stale moves if user restarted quickly.
        const { winner, isDraw } = getGameOutcome(prev);
        if (winner || isDraw) return prev;
        if (prev[move] != null) return prev;

        const next = prev.slice();
        next[move] = aiPlayer;
        return next;
      });

      setXIsNext((prev) => !prev);
      setAiThinking(false);
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [mode, xIsNext, squares, aiPlayer, humanPlayer, difficulty, gameOver]);

  // If switching to Human vs AI and the AI should start, let the effect handle it.
  useEffect(() => {
    if (mode !== "HUMAN_AI") return;
    // Ensure thinking is cleared when changing mode/symbol.
    setAiThinking(false);
  }, [mode, humanPlayer]);

  return (
    <div className="app">
      <div className="card">
        <h1 className="title">Tic Tac Toe</h1>

        <div className="statusRow">
          <div className="status" aria-live="polite">
            {status}
          </div>

          <div className="controls" aria-label="Game controls">
            <label className="control">
              <span className="controlLabel">Mode</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="select"
                aria-label="Select game mode"
              >
                <option value="HUMAN_HUMAN">Human vs Human</option>
                <option value="HUMAN_AI">Human vs AI</option>
              </select>
            </label>

            <label className="control">
              <span className="controlLabel">You</span>
              <select
                value={humanPlayer}
                onChange={(e) => setHumanPlayer(e.target.value)}
                className="select"
                aria-label="Choose your symbol"
                disabled={aiThinking}
              >
                <option value="X">X</option>
                <option value="O">O</option>
              </select>
            </label>

            <label className="control">
              <span className="controlLabel">AI</span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="select"
                aria-label="AI difficulty"
                disabled={mode !== "HUMAN_AI" || aiThinking}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </label>
          </div>
        </div>

        <Board squares={squares} onPlay={handlePlay} disabled={boardDisabled} />

        <div className="footer">
          <button className="button" onClick={resetBoardOnly}>
            Restart
          </button>
        </div>

        <div className="hint">
          {mode === "HUMAN_AI" ? (
            <span>
              You are <strong>{humanPlayer}</strong>. AI is <strong>{aiPlayer}</strong>.
            </span>
          ) : (
            <span>Two-player local mode.</span>
          )}
        </div>
      </div>
    </div>
  );
}
