import React, { useEffect, useMemo, useRef, useState } from "react";
import { getAiMove, getGameOutcome } from "./ai/minimax";
import ThemeToggle from "./components/ThemeToggle";

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

function emptyBoard() {
  return Array(9).fill(null);
}

/**
 * Returns who should play first for a given game in a series.
 * Game #1 starts with X, game #2 starts with O, and so on.
 */
function startingPlayerForGameNumber(gameNumber) {
  return gameNumber % 2 === 1 ? "X" : "O";
}

function computeStatus({ mode, aiThinking, outcome, xIsNext, humanPlayer, aiPlayer }) {
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

function seriesWinnerFromScores({ xWins, oWins }) {
  if (xWins >= 3) return "X";
  if (oWins >= 3) return "O";
  return null;
}

export default function App() {
  const [squares, setSquares] = useState(() => emptyBoard());
  const [xIsNext, setXIsNext] = useState(true);

  const [theme, setTheme] = useState(() => {
    // Default to Light; load stored preference if present.
    try {
      const stored = window.localStorage.getItem("ttt_theme");
      return stored === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  const [mode, setMode] = useState("HUMAN_HUMAN"); // "HUMAN_HUMAN" | "HUMAN_AI"
  const [humanPlayer, setHumanPlayer] = useState("X"); // "X" | "O"
  const [difficulty, setDifficulty] = useState("Medium"); // "Easy" | "Medium" | "Hard"
  const [aiThinking, setAiThinking] = useState(false);

  // Best-of-5 series controls/state
  const [bestOf5Enabled, setBestOf5Enabled] = useState(false);
  const [series, setSeries] = useState(() => ({
    gameNumber: 1, // 1..5 (but series can end early when someone reaches 3)
    xWins: 0,
    oWins: 0,
    draws: 0
  }));

  const aiPlayer = useMemo(() => (humanPlayer === "X" ? "O" : "X"), [humanPlayer]);

  const outcome = useMemo(() => getGameOutcome(squares), [squares]);
  const gameOver = outcome.winner != null || outcome.isDraw;

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

  const seriesWinner = useMemo(() => {
    if (!bestOf5Enabled) return null;
    return seriesWinnerFromScores(series);
  }, [bestOf5Enabled, series]);

  const boardDisabled =
    gameOver || (mode === "HUMAN_AI" && (aiThinking || currentPlayer === aiPlayer));

  const canAdvanceSeries =
    bestOf5Enabled && gameOver && !seriesWinner && series.gameNumber < 5;

  const shouldShowStartNewSeries =
    bestOf5Enabled && (seriesWinner != null || series.gameNumber >= 5) && gameOver;

  /**
   * Reset only the current board state (per requirement: does not reset series scores).
   * PUBLIC_INTERFACE
   */
  function resetBoardOnly(nextStarter = "X") {
    setSquares(emptyBoard());
    setXIsNext(nextStarter === "X");
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

  // Track outcome -> update scoreboard/series score once per finished game.
  const lastCountedGameKeyRef = useRef(null);
  useEffect(() => {
    if (!gameOver) {
      // Reset guard once game restarts.
      lastCountedGameKeyRef.current = null;
      return;
    }

    const key = bestOf5Enabled ? `series-${series.gameNumber}` : "single";
    if (lastCountedGameKeyRef.current === key) return;

    lastCountedGameKeyRef.current = key;

    setSeries((prev) => {
      // When best-of-5 is disabled we still keep "session scoreboard" in these fields.
      // When enabled, these are also the series scoreboard.
      if (outcome.winner === "X") return { ...prev, xWins: prev.xWins + 1 };
      if (outcome.winner === "O") return { ...prev, oWins: prev.oWins + 1 };
      if (outcome.isDraw) return { ...prev, draws: prev.draws + 1 };
      return prev;
    });
  }, [gameOver, outcome.winner, outcome.isDraw, bestOf5Enabled, series.gameNumber]);

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

  // If switching to Human vs AI ensure thinking is cleared.
  useEffect(() => {
    if (mode !== "HUMAN_AI") return;
    setAiThinking(false);
  }, [mode, humanPlayer]);

  // Persist theme preference.
  useEffect(() => {
    try {
      window.localStorage.setItem("ttt_theme", theme);
    } catch {
      // Ignore storage failures (private mode / blocked storage).
    }
  }, [theme]);

  // When toggling best-of-5 ON, start a fresh series (but keep mode/difficulty/humanPlayer).
  useEffect(() => {
    if (!bestOf5Enabled) return;

    setSeries({
      gameNumber: 1,
      xWins: 0,
      oWins: 0,
      draws: 0
    });
    resetBoardOnly("X");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bestOf5Enabled]);

  // PUBLIC_INTERFACE
  function handleNextGame() {
    /** Advance to the next game in a best-of-5 series, alternating the starting player. */
    if (!canAdvanceSeries) return;

    setSeries((prev) => {
      const nextGameNumber = prev.gameNumber + 1;
      return { ...prev, gameNumber: nextGameNumber };
    });

    const nextStarter = startingPlayerForGameNumber(series.gameNumber + 1);
    resetBoardOnly(nextStarter);
  }

  // PUBLIC_INTERFACE
  function handleStartNewSeries() {
    /** Start a new best-of-5 series (resets series scoreboard and game count, but keeps preferences). */
    setSeries({
      gameNumber: 1,
      xWins: 0,
      oWins: 0,
      draws: 0
    });
    resetBoardOnly("X");
  }

  // PUBLIC_INTERFACE
  function handleRestartGame() {
    /** Restart just the current board (keeps series scoreboard and preferences). */
    const starter = bestOf5Enabled
      ? startingPlayerForGameNumber(series.gameNumber)
      : "X";
    resetBoardOnly(starter);
  }

  const seriesLabel = bestOf5Enabled
    ? `Game ${series.gameNumber} of 5`
    : "Scoreboard";

  // PUBLIC_INTERFACE
  function handleToggleTheme() {
    /** Toggle between Light and Dark themes; persists to localStorage. */
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return (
    <div className="app" data-theme={theme}>
      <div className="card">
        <div className="titleRow">
          <h1 className="title">Tic Tac Toe</h1>
          <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
        </div>

        <div className="scoreboard" aria-label="Scoreboard">
          <div className="scoreHeader">
            <div className="scoreTitle">{seriesLabel}</div>
            <label className="toggle" aria-label="Toggle best of 5 series">
              <input
                type="checkbox"
                checked={bestOf5Enabled}
                onChange={(e) => setBestOf5Enabled(e.target.checked)}
              />
              <span>Best-of-5</span>
            </label>
          </div>

          <div className="scoreRow">
            <div className="scorePill">
              <span className="scoreKey">X</span>
              <span className="scoreVal">{series.xWins}</span>
            </div>
            <div className="scorePill">
              <span className="scoreKey">O</span>
              <span className="scoreVal">{series.oWins}</span>
            </div>
            <div className="scorePill">
              <span className="scoreKey">Draws</span>
              <span className="scoreVal">{series.draws}</span>
            </div>
          </div>

          {bestOf5Enabled && (
            <div className="seriesMeta" aria-live="polite">
              {seriesWinner ? (
                <div className="seriesBanner">
                  Series winner: <strong>{seriesWinner}</strong> (first to 3)
                </div>
              ) : (
                <div className="seriesSmall">
                  {`X ${series.xWins} - O ${series.oWins}`}
                  {series.draws > 0 ? ` • Draws ${series.draws}` : ""}
                </div>
              )}
            </div>
          )}
        </div>

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

        <div className="footer footerMulti">
          <button className="button" onClick={handleRestartGame}>
            Restart Game
          </button>

          {bestOf5Enabled && canAdvanceSeries && (
            <button className="button buttonPrimary" onClick={handleNextGame}>
              Next Game
            </button>
          )}

          {bestOf5Enabled && shouldShowStartNewSeries && (
            <button className="button buttonPrimary" onClick={handleStartNewSeries}>
              Start New Series
            </button>
          )}
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
