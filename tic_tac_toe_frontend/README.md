# Tic Tac Toe (React)

Features:
- Human vs Human
- Human vs AI (Minimax) with difficulty (Easy/Medium/Hard)
- Winner and draw detection
- In-session scoreboard (X wins, O wins, Draws)
- Optional Best-of-5 series mode (first to 3 wins)

## Run
```bash
npm install
npm start
```
Then open http://localhost:3000

## Theme toggle (Light/Dark)
A **Theme** toggle is available in the header. It switches between **Light** and **Dark** themes.

- Default theme is **Light**
- Your preference is saved in `localStorage` under the key `ttt_theme`
- On page load, the app initializes from the stored value if present

## Scoreboard
A compact scoreboard is shown above the board:
- **X**: number of games won by X
- **O**: number of games won by O
- **Draws**: number of drawn games

Scores are kept **in memory for the current browser session** and reset on page reload.

## Best-of-5 series mode
Enable **Best-of-5** using the toggle above the board.

When enabled:
- The series starts at **Game 1 of 5**
- The first player to reach **3 wins** is the **series winner**
- **Draws do not count as wins**, but they are tracked in the **Draws** counter
- After each finished game (win/draw), click **Next Game** to advance
- When the series winner is determined, **Next Game** is disabled and a **Start New Series** button appears

Notes:
- **Restart Game** resets only the current board (it does *not* reset series scores)
- Mode (Human vs Human / Human vs AI), your symbol, and AI difficulty are preserved when starting a new series
- In Human vs AI mode, if the AI is due to move first in the next game, it will automatically play after you click **Next Game** / **Start New Series**
