const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
let currentPlayer = 1;  // Player 1 starts (human)
let selectedPiece = null;

const boardState = [
    [null, 'player2', null, 'player2', null, 'player2', null, 'player2'],
    ['player2', null, 'player2', null, 'player2', null, 'player2', null],
    [null, 'player2', null, 'player2', null, 'player2', null, 'player2'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['player1', null, 'player1', null, 'player1', null, 'player1', null],
    [null, 'player1', null, 'player1', null, 'player1', null, 'player1'],
    ['player1', null, 'player1', null, 'player1', null, 'player1', null]
];

function createBoard() {
    boardElement.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
            cell.dataset.row = row;
            cell.dataset.col = col;

            const piece = boardState[row][col];
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', piece);
                // Add an inline style to differentiate kings visually
                if (piece.includes('king')) {
                    pieceElement.style.border = '2px solid gold'; // Gold border for kings
                    pieceElement.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.5)'; // Gold glow effect
                }
                cell.appendChild(pieceElement);
            }

            cell.addEventListener('click', () => onCellClick(row, col));
            boardElement.appendChild(cell);
        }
    }
}

function onCellClick(row, col) {
    if (currentPlayer === 2) return;  // Disable user input on computer's turn

    const piece = boardState[row][col];

    if (selectedPiece) {
        movePiece(row, col);
    } else if (piece && piece.startsWith(`player${currentPlayer}`)) {
        selectPiece(row, col);
    }
}

function selectPiece(row, col) {
    selectedPiece = { row, col };
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cell.classList.add('selected');
}

function movePiece(targetRow, targetCol) {
    const { row: startRow, col: startCol } = selectedPiece;
    const piece = boardState[startRow][startCol];

    const result = validateMove(startRow, startCol, targetRow, targetCol, piece);
    if (result.isValid) {
        boardState[startRow][startCol] = null;
        boardState[targetRow][targetCol] = piece;

        // Check for promotion to king
        promoteToKing(targetRow, targetCol, piece);

        if (result.capture) {
            const { row: captureRow, col: captureCol } = result.capture;
            boardState[captureRow][captureCol] = null;  // Remove the captured piece
        }

        if (checkForWinner()) return;  // Check for a winner after the move

        switchPlayer();
    }

    selectedPiece = null;
    createBoard();  // Re-render the board
}

function validateMove(startRow, startCol, targetRow, targetCol, piece) {
    const rowDiff = targetRow - startRow;
    const colDiff = targetCol - startCol;

    // Regular move (one diagonal step)
    if (Math.abs(colDiff) === 1 && ((piece === 'player1' && rowDiff === -1) || (piece === 'player2' && rowDiff === 1))) {
        return { isValid: !boardState[targetRow][targetCol], capture: null };  // Target cell must be empty for a simple move
    }

    // Capture move (jump over opponent's piece)
    if (Math.abs(colDiff) === 2 && ((piece === 'player1' && rowDiff === -2) || (piece === 'player2' && rowDiff === 2))) {
        const middleRow = (startRow + targetRow) / 2;
        const middleCol = (startCol + targetCol) / 2;
        const middlePiece = boardState[middleRow][middleCol];

        // There must be an opponent's piece to jump over, and the target cell must be empty
        if (middlePiece && middlePiece !== piece && !boardState[targetRow][targetCol]) {
            return { isValid: true, capture: { row: middleRow, col: middleCol } };  // Return the capture coordinates
        }
    }

    // King moves (any diagonal step for kings)
    if (piece.includes('king')) {
        if (Math.abs(colDiff) === 1 && Math.abs(rowDiff) === 1) {
            return { isValid: !boardState[targetRow][targetCol], capture: null };  // Target cell must be empty
        }
        // Capture move (jump over opponent's piece for kings)
        if (Math.abs(colDiff) === 2 && Math.abs(rowDiff) === 2) {
            const middleRow = (startRow + targetRow) / 2;
            const middleCol = (startCol + targetCol) / 2;
            const middlePiece = boardState[middleRow][middleCol];
            if (middlePiece && middlePiece !== piece && !boardState[targetRow][targetCol]) {
                return { isValid: true, capture: { row: middleRow, col: middleCol } };  // Return the capture coordinates
            }
        }
    }

    return { isValid: false, capture: null };
}

function promoteToKing(row, col, piece) {
    if (piece === 'player1' && row === 0) {
        boardState[row][col] = 'player1_king'; // Promote to king
    } else if (piece === 'player2' && row === 7) {
        boardState[row][col] = 'player2_king'; // Promote to king
    }
}

function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    statusElement.textContent = `क्रीडक ${currentPlayer} वर्तते(बारी)`;

    if (currentPlayer === 2) {
        setTimeout(computerMove, 500);  // Let computer move after a short delay
    }
}

function computerMove() {
    const validMoves = getAllValidMoves('player2');

    // Prioritize capturing moves if available
    const captureMoves = validMoves.filter(move => move.capture);

    const moveToMake = captureMoves.length > 0 ? captureMoves[Math.floor(Math.random() * captureMoves.length)] : validMoves[Math.floor(Math.random() * validMoves.length)];

    if (moveToMake) {
        const { startRow, startCol, targetRow, targetCol, capture } = moveToMake;

        // Move the computer's piece
        boardState[startRow][startCol] = null;
        boardState[targetRow][targetCol] = 'player2';

        // Remove the captured piece if any
        if (capture) {
            boardState[capture.row][capture.col] = null;
        }

        // Check for promotion to king
        promoteToKing(targetRow, targetCol, 'player2');

        if (checkForWinner()) return;  // Check for a winner after the move

        createBoard();  // Re-render the board
        switchPlayer();  // Back to player 1
    }
}

function getAllValidMoves(player) {
    const moves = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = boardState[row][col];
            if (piece && piece.startsWith(player)) {
                const validMove = getValidMoveForPiece(row, col, piece);
                if (validMove) {
                    moves.push(validMove);
                }
            }
        }
    }
    return moves;
}

function getValidMoveForPiece(row, col, piece) {
    const possibleMoves = [
        { row: row + 1, col: col - 1 },
        { row: row + 1, col: col + 1 },
        { row: row - 1, col: col - 1 },
        { row: row - 1, col: col + 1 },
        { row: row + 2, col: col - 2 },
        { row: row + 2, col: col + 2 },
        { row: row - 2, col: col - 2 },
        { row: row - 2, col: col + 2 }
    ];

    for (const move of possibleMoves) {
        const { row: targetRow, col: targetCol } = move;
        if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
            const result = validateMove(row, col, targetRow, targetCol, piece);
            if (result.isValid) {
                return { startRow: row, startCol: col, targetRow, targetCol, capture: result.capture };
            }
        }
    }
    return null;
}

function checkForWinner() {
    const player1Pieces = boardState.flat().filter(piece => piece === 'player1' || piece === 'player1_king').length;
    const player2Pieces = boardState.flat().filter(piece => piece === 'player2' || piece === 'player2_king').length;

    if (player1Pieces === 0) {
        statusElement.textContent = 'क्रीडक २ जयति! (खिलाडी २ विजयी है!)';  // Player 2 wins
        return true;
    } else if (player2Pieces === 0) {
        statusElement.textContent = 'क्रीडक 1 जयति! (खिलाडी १ विजयी है!)';  // Player 1 wins
        return true;
    }

    return false;
}

function resetGame() {
    selectedPiece = null;
    currentPlayer = 1;
    statusElement.textContent = 'क्रीडक १ वर्तते(बारी)';

    // Reset the board to the initial state
    boardState.splice(0, boardState.length, 
        [null, 'player2', null, 'player2', null, 'player2', null, 'player2'],
        ['player2', null, 'player2', null, 'player2', null, 'player2', null],
        [null, 'player2', null, 'player2', null, 'player2', null, 'player2'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['player1', null, 'player1', null, 'player1', null, 'player1', null],
        [null, 'player1', null, 'player1', null, 'player1', null, 'player1'],
        ['player1', null, 'player1', null, 'player1', null, 'player1', null]
    );

    createBoard();
}

createBoard();
