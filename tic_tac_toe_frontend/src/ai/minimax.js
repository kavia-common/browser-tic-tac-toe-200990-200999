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

function getRandomElement(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function getNonLosingMoves(board, aiPlayer, humanPlayer) {
  const available = getAvailableMoves(board);
  const safe = [];

  for (const move of available) {
    const next = board.slice();
    next[move] = aiPlayer;

    // If this move immediately wins, it is certainly not losing.
    if (getWinner(next) === aiPlayer) {
      safe.push(move);
      continue;
    }

    // If the human has an immediate winning reply, avoid this move.
    const humanReplies = getAvailableMoves(next);
    let humanCanWin = false;
    for (const reply of humanReplies) {
      const replyBoard = next.slice();
      replyBoard[reply] = humanPlayer;
      if (getWinner(replyBoard) === humanPlayer) {
        humanCanWin = true;
        break;
      }
    }

    if (!humanCanWin) safe.push(move);
  }

  return safe;
}

function getMoveEasy(board) {
  const available = getAvailableMoves(board);
  if (available.length === 0) return null;

  // 30% of the time, bias toward corners/center *if available*.
  const biasCells = [4, 0, 2, 6, 8];
  const biasedAvailable = biasCells.filter((i) => board[i] == null);

  if (biasedAvailable.length > 0 && Math.random() < 0.3) {
    return getRandomElement(biasedAvailable);
  }

  // Otherwise, fully random among valid moves.
  return getRandomElement(available);
}

function getMoveHard(board, aiPlayer, humanPlayer) {
  const winner = getWinner(board);
  const available = getAvailableMoves(board);
  if (winner != null || available.length === 0) return null;

  const result = minimax(board, aiPlayer, aiPlayer, humanPlayer, 0);
  return result.move;
}

function getMoveMedium(board, aiPlayer, humanPlayer) {
  const winner = getWinner(board);
  const available = getAvailableMoves(board);
  if (winner != null || available.length === 0) return null;

  const best = getMoveHard(board, aiPlayer, humanPlayer);
  if (best == null) return null;

  // 70%: take best minimax move.
  if (Math.random() < 0.7) return best;

  // 30%: choose a random among non-losing moves if available, otherwise random valid.
  const safe = getNonLosingMoves(board, aiPlayer, humanPlayer);

  // Prefer "safe but not necessarily best" to make the AI feel imperfect.
  const safeNonBest = safe.filter((m) => m !== best);
  if (safeNonBest.length > 0) return getRandomElement(safeNonBest);

  if (safe.length > 0) return getRandomElement(safe);

  return getRandomElement(available);
}

/**
 * PUBLIC_INTERFACE
 * getAiMove(board, aiSymbol, humanSymbol, difficulty)
 *
 * Single entry point for AI move selection. Dispatches to the correct strategy.
 *
 * @param {Array<("X"|"O"|null)>} board Current board state (length 9)
 * @param {"X"|"O"} aiSymbol AI symbol
 * @param {"X"|"O"} humanSymbol Human symbol
 * @param {"Easy"|"Medium"|"Hard"} difficulty
 * @returns {number|null} Move index, or null if no moves available / game over
 */
export function getAiMove(board, aiSymbol, humanSymbol, difficulty = "Medium") {
  const available = getAvailableMoves(board);
  const winner = getWinner(board);
  if (winner != null || available.length === 0) return null;

  if (difficulty === "Easy") return getMoveEasy(board);
  if (difficulty === "Hard") return getMoveHard(board, aiSymbol, humanSymbol);

  // Default/Medium
  return getMoveMedium(board, aiSymbol, humanSymbol);
}

/**
 * PUBLIC_INTERFACE
 * getBestMove(board, aiPlayer, humanPlayer, options?)
 *
 * Pure function that returns the best move index (0..8) for the AI using Minimax.
 * This remains the "Hard" / optimal play implementation.
 *
 * @param {Array<("X"|"O"|null)>} board Current board state (length 9)
 * @param {"X"|"O"} aiPlayer AI symbol
 * @param {"X"|"O"} humanPlayer Human symbol
 * @param {{difficulty?: "Easy"|"Medium"|"Hard"}} [options] (retained for backwards compatibility)
 * @returns {number|null} Best move index, or null if no moves available / game over
 */
export function getBestMove(board, aiPlayer, humanPlayer, options = {}) {
  const { difficulty = "Hard" } = options;

  // Historically this function also supported difficulty tweaks; keep behavior stable:
  // - Easy: random
  // - Medium: sometimes random
  // - Hard: full minimax
  const winner = getWinner(board);
  const available = getAvailableMoves(board);
  if (winner != null || available.length === 0) return null;

  if (difficulty === "Easy") {
    return getRandomElement(available);
  }

  if (difficulty === "Medium") {
    if (Math.random() < 0.3) {
      return getRandomElement(available);
    }
  }

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
