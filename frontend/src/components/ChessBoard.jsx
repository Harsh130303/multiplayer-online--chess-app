import React, { useState } from 'react';

const Piece = ({ type }) => {
    if (!type || type === '.') return null;

    const isWhite = type === type.toUpperCase();
    const p = type.toLowerCase();

    // Standard Wikipedia-style (Cburnett) SVG paths
    const pieces = {
        k: (
            <g fill={isWhite ? "#fff" : "#000"} stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.5 11.63V6M20 8h5" stroke={isWhite ? "#000" : "#fff"} />
                <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
                <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3-7.5-12.5-10.5-16.5-4-3 6 5.5 10.5 5.5 10.5v7Z" />
                <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" fill="none" stroke={isWhite ? "#000" : "#fff"} />
            </g>
        ),
        q: (
            <g fill={isWhite ? "#fff" : "#000"} stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM24.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM11 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM38 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
                <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26Z" />
                <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 0.5 3.5-1.5 1-1 2.5-1 2.5-1.5 1.5 0 2.5 0 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 0.5-1.5-1-2.5-0.5-2.5-0.5-2 0.5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0Z" />
                <path d="M11.5 30c3.5-1 18.5-1 22 0m-22.5 3.5c6-1 15-1 21 0" fill="none" stroke={isWhite ? "#000" : "#fff"} />
            </g>
        ),
        r: (
            <g fill={isWhite ? "#fff" : "#000"} stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 39h27v-3H9v3ZM12 36v-4h21v4H12ZM11 14V9h4v2h5V9h5v2h5V9h4v5" />
                <path d="M34 14l-3 3H14l-3-3ZM31 17v12.5H14V17ZM31 29.5l1.5 2.5h-20l1.5-2.5" />
                <path d="M11 14h23" fill="none" stroke={isWhite ? "#000" : "#fff"} />
            </g>
        ),
        b: (
            <g fill={isWhite ? "#fff" : "#000"} stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 36c3.39-1 10.11.4 13.5-2 3.39 2.4 10.11 1 13.5 2 0 0 0 2-2 2.5-2 .5-25 .5-27 0-2-.5-2-2.5-2-2.5Z" />
                <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2Z" />
                <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM17.5 26h10M15 30h15" fill="none" stroke={isWhite ? "#000" : "#fff"} />
            </g>
        ),
        n: (
            <g fill={isWhite ? "#fff" : "#000"} stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
                <path d="M24 18c0.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12 0 0 1.89-1.9 2-3.5-0.73-1-.5-2-.5-3 1-1 3 2.5 3 2.5l2 0c0 0 .78-1.992 2.5-3 1 0 1 3 1 3" />
                <path d="M13 14.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM17.5 12c-0.5 0.5-0.5 1.5-0.5 1.5" fill="none" stroke={isWhite ? "#000" : "#fff"} />
            </g>
        ),
        p: (
            <g fill={isWhite ? "#fff" : "#000"} stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4Z" />
            </g>
        )
    };

    return (
        <svg viewBox="0 0 45 45" width="45" height="45" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))', pointerEvents: 'none' }}>
            {pieces[p]}
        </svg>
    );
};


const ChessBoard = ({ board, onMove, turn, myColor, lastMove, validMoves = [], onSelect, onDeselect }) => {
    const [selected, setSelected] = useState(null);

    const getSquareColor = (row, col) => {
        const isEven = (row + col) % 2 === 0;
        let baseColor = isEven ? '#f0d9b5' : '#b58863';

        // Convert to algebraic for comparison
        const rank = 8 - row;
        const file = String.fromCharCode(97 + col);
        const squareId = `${file}${rank}`;

        // Highlight Last Move (Option A: Slate Blue)
        if (lastMove) {
            if (lastMove.from_square === squareId || lastMove.to_square === squareId) {
                return isEven ? '#aba2c9' : '#897da5'; // Muted Slate Blue
            }
        }

        return baseColor;
    };

    const handleClick = (row, col) => {
        if (!myColor) return;

        // Selecting a piece
        if (!selected) {
            const piece = board[row][col];
            if (!piece || piece === '.') return;

            // Check if piece belongs to player
            const isWhitePiece = piece === piece.toUpperCase();

            if (myColor === 'white' && !isWhitePiece) return;
            if (myColor === 'black' && isWhitePiece) return;

            setSelected({ row, col });
            if (onSelect) onSelect(row, col);
        } else {
            // Moving
            // If clicking same square, deselect
            if (selected.row === row && selected.col === col) {
                setSelected(null);
                if (onDeselect) onDeselect();
                return;
            }

            // If clicking another piece of the same color, switch selection
            const targetPiece = board[row][col];
            if (targetPiece !== '.') {
                const isTargetWhite = targetPiece === targetPiece.toUpperCase();
                if ((myColor === 'white' && isTargetWhite) || (myColor === 'black' && !isTargetWhite)) {
                    setSelected({ row, col });
                    if (onSelect) onSelect(row, col);
                    return;
                }
            }

            const fromFile = String.fromCharCode(97 + selected.col);
            const fromRank = 8 - selected.row;
            const toFile = String.fromCharCode(97 + col);
            const toRank = 8 - row;

            onMove(`${fromFile}${fromRank}`, `${toFile}${toRank}`);
            setSelected(null);
            if (onDeselect) onDeselect();
        }
    };

    const isBlack = myColor === 'black';

    // Create the visual grid based on orientation
    const visualBoard = [];
    if (isBlack) {
        for (let r = 7; r >= 0; r--) {
            const rowArr = [];
            for (let c = 7; c >= 0; c--) {
                rowArr.push({ r, c, piece: board[r][c] });
            }
            visualBoard.push(rowArr);
        }
    } else {
        for (let r = 0; r <= 7; r++) {
            const rowArr = [];
            for (let c = 0; c <= 7; c++) {
                rowArr.push({ r, c, piece: board[r][c] });
            }
            visualBoard.push(rowArr);
        }
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(8, var(--sq-size, 60px))`,
            gridTemplateRows: `repeat(8, var(--sq-size, 60px))`,
            border: 'calc(var(--sq-size, 60px) * 0.15) solid #2d241e',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            backgroundColor: '#2d241e',
            width: 'fit-content',
            margin: '0 auto',
            overflow: 'hidden'
        }}>
            {visualBoard.map((rowArr, visualR) => (
                rowArr.map(({ r, c, piece }, visualC) => {
                    const squareId = `${String.fromCharCode(97 + c)}${8 - r}`;
                    const isValidMove = validMoves.includes(squareId);

                    return (
                        <div
                            key={`${r}-${c}`}
                            onClick={() => handleClick(r, c)}
                            style={{
                                width: 'var(--sq-size, 60px)',
                                height: 'var(--sq-size, 60px)',
                                backgroundColor:
                                    (selected && selected.row === r && selected.col === c)
                                        ? '#7b61ff' // Selected highlight
                                        : getSquareColor(r, c),
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer',
                                userSelect: 'none',
                                transition: 'all 0.2s',
                                position: 'relative',
                                boxShadow: isValidMove
                                    ? (piece === '.'
                                        ? 'inset 0 0 15px rgba(34, 197, 94, 0.6)'
                                        : 'inset 0 0 25px rgba(220, 38, 38, 0.8)')
                                    : 'none'
                            }}
                        >
                            <div style={{ transform: 'scale(calc(var(--sq-size, 60px) / 60))' }}>
                                <Piece type={piece} />
                            </div>

                            {isValidMove && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: piece === '.' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(220, 38, 38, 0.35)',
                                    pointerEvents: 'none',
                                    zIndex: 1
                                }} />
                            )}
                            {isValidMove && piece === '.' && (
                                <div style={{
                                    position: 'absolute',
                                    width: '10px', height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(34, 197, 94, 0.5)',
                                    pointerEvents: 'none',
                                    zIndex: 2
                                }} />
                            )}
                        </div>
                    );
                })
            ))}
        </div>
    );
};

export default ChessBoard;
