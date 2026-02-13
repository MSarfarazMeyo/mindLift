import {
  Board,
  ROWS,
  COLS,
  Player,
  cloneBoard,
  getAvailableColumns,
  dropPiece,
  checkWin,
  isBoardFull,
} from './connect-four-logic';

const AI: Player = 2;
const HUMAN: Player = 1;

function evaluateWindow(window: number[], player: Player): number {
  const opponent: Player = player === AI ? HUMAN : AI;
  const playerCount = window.filter(c => c === player).length;
  const opponentCount = window.filter(c => c === opponent).length;
  const emptyCount = window.filter(c => c === 0).length;

  if (playerCount === 4) return 100;
  if (playerCount === 3 && emptyCount === 1) return 5;
  if (playerCount === 2 && emptyCount === 2) return 2;
  if (opponentCount === 3 && emptyCount === 1) return -4;
  return 0;
}

function scorePosition(board: Board, player: Player): number {
  let score = 0;

  const centerCol = Math.floor(COLS / 2);
  const centerCount = board.reduce((acc, row) => acc + (row[centerCol] === player ? 1 : 0), 0);
  score += centerCount * 3;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]];
      score += evaluateWindow(window, player);
    }
  }

  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const window = [board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]];
      score += evaluateWindow(window, player);
    }
  }

  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];
      score += evaluateWindow(window, player);
    }
  }

  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r - 1][c + 1], board[r - 2][c + 2], board[r - 3][c + 3]];
      score += evaluateWindow(window, player);
    }
  }

  return score;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
): [number | null, number] {
  const availableCols = getAvailableColumns(board);

  if (checkWin(board, AI)) return [null, 100000 + depth];
  if (checkWin(board, HUMAN)) return [null, -100000 - depth];
  if (isBoardFull(board) || depth === 0) return [null, scorePosition(board, AI)];

  if (isMaximizing) {
    let value = -Infinity;
    let bestCol = availableCols[Math.floor(Math.random() * availableCols.length)];

    for (const col of availableCols) {
      const tempBoard = cloneBoard(board);
      dropPiece(tempBoard, col, AI);
      const [, newScore] = minimax(tempBoard, depth - 1, alpha, beta, false);
      if (newScore > value) {
        value = newScore;
        bestCol = col;
      }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return [bestCol, value];
  } else {
    let value = Infinity;
    let bestCol = availableCols[Math.floor(Math.random() * availableCols.length)];

    for (const col of availableCols) {
      const tempBoard = cloneBoard(board);
      dropPiece(tempBoard, col, HUMAN);
      const [, newScore] = minimax(tempBoard, depth - 1, alpha, beta, true);
      if (newScore < value) {
        value = newScore;
        bestCol = col;
      }
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return [bestCol, value];
  }
}

export function getAIMove(board: Board, difficulty: number = 5): number {
  const [bestCol] = minimax(board, difficulty, -Infinity, Infinity, true);
  if (bestCol === null) {
    const available = getAvailableColumns(board);
    return available[Math.floor(Math.random() * available.length)];
  }
  return bestCol;
}
