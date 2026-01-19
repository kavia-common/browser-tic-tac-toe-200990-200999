/**
 * Minimax implementation for 3x3 Tic Tac Toe.
 * Board is an array of 9 entries: null | "X" | "O".
 */

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

function getWinner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function getAvailableMoves(board) {
  const moves = [];
  for (let i = 0; i < board.length; i += 1) {
    if (board[i] == null) moves.push(i);
  }
  return moves;
}

function isDraw(board) {
  return getWinner(board) == null && getAvailableMoves(board).length === 0;
}

/**
 * Returns a score for the terminal board state from the AI's perspective.
 * Faster wins are slightly preferred; slower losses are slightly preferred.
 */
function scoreTerminal(board, aiPlayer, humanPlayer, depth) {
  const winner = getWinner(board);
  if (winner === aiPlayer) return 10 - depth;
  if (winner === humanPlayer) return depth - 10;
  if (isDraw(board)) return 0;
  return null;
}

function minimax(board, currentPlayer, aiPlayer, humanPlayer, depth) {
  const terminalScore = scoreTerminal(board, aiPlayer, humanPlayer, depth);
  if (terminalScore != null) {
    return { score: terminalScore, move: null };
  }

  const moves = getAvailableMoves(board);
  const maximizing = currentPlayer === aiPlayer;

  let best = {
    score: maximizing ? -Infinity : Infinity,
    move: null
  };

  for (const move of moves) {
    const next = board.slice();
    next[move] = currentPlayer;

    const nextPlayer = currentPlayer === "X" ? "O" : "X";
    const result = minimax(next, nextPlayer, aiPlayer, humanPlayer, depth + 1);

    if (maximizing) {
      if (result.score > best.score) best = { score: result.score, move };
    } else {
      if (result.score < best.score) best = { score: result.score, move };
    }
  }

  return best;
}

/**
 * PUBLIC_INTERFACE
 * getBestMove(board, aiPlayer, humanPlayer, options?)
 *
 * Pure function that returns the best move index (0..8) for the AI using Minimax.
 *
 * @param {Array<("X"|"O"|null)>} board Current board state (length 9)
 * @param {"X"|"O"} aiPlayer AI symbol
 * @param {"X"|"O"} humanPlayer Human symbol
 * @param {{difficulty?: "Easy"|"Medium"|"Hard"}} [options]
 * @returns {number|null} Best move index, or null if no moves available / game over
 */
export function getBestMove(board, aiPlayer, humanPlayer, options = {}) {
  const { difficulty = "Hard" } = options;

  const winner = getWinner(board);
  const available = getAvailableMoves(board);
  if (winner != null || available.length === 0) return null;

  // Easy: random move
  if (difficulty === "Easy") {
    return available[Math.floor(Math.random() * available.length)];
  }

  // Medium: 30% random, otherwise minimax (still strong but not perfect)
  if (difficulty === "Medium") {
    if (Math.random() < 0.3) {
      return available[Math.floor(Math.random() * available.length)];
    }
  }

  // Hard (and Medium's non-random path): full minimax
  const result = minimax(board, aiPlayer, aiPlayer, humanPlayer, 0);
  return result.move;
}

/**
 * PUBLIC_INTERFACE
 * getGameOutcome(board)
 *
 * Helper for UI: returns {winner, isDraw}.
 *
 * @param {Array<("X"|"O"|null)>} board
 * @returns {{winner: ("X"|"O"|null), isDraw: boolean}}
 */
export function getGameOutcome(board) {
  const winner = getWinner(board);
  return { winner, isDraw: winner == null && getAvailableMoves(board).length === 0 };
}
