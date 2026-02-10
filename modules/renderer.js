/**
 * Game Renderer
 * Handles rendering the game grid and updating UI displays
 */

import { ENV } from "../utils/env.js";

/**
 * Render the game grid
 * @param {HTMLElement} gridEl - Grid container element
 * @param {object} state - Game state from engine
 * @param {number} width - Grid width
 * @param {number} height - Grid height
 * @param {Function} isWallFn - Function to check if position is a wall
 */
export function renderGrid(gridEl, state, width, height, isWallFn) {
    gridEl.innerHTML = '';

    const frag = document.createDocumentFragment();

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.setAttribute('role', 'gridcell');

            // Determine cell type and add appropriate class and ARIA label
            let cellType = 'empty';
            let ariaLabel = '';

            if (x === state.player.x && y === state.player.y) {
                cell.classList.add('player');

                // Add dead class if game over and lost
                if (state.status === 'lost') {
                    cell.classList.add('dead');
                }

                cellType = 'player';
                ariaLabel = `Player at ${getCoordinateLabel(x, y)}`;
            } else if (state.zombies.some(z => z.x === x && z.y === y)) {
                cell.classList.add('zombie');
                cellType = 'zombie';
                ariaLabel = `Zombie at ${getCoordinateLabel(x, y)}`;
            } else if (isWallFn(x, y)) {
                cell.classList.add('wall');
                cellType = 'wall';
                ariaLabel = `Wall at ${getCoordinateLabel(x, y)}`;
            } else if (state.exit.x === x && state.exit.y === y) {
                cell.classList.add('exit');
                cellType = 'exit';
                ariaLabel = `Exit at ${getCoordinateLabel(x, y)}`;
            } else {
                ariaLabel = `Empty cell at ${getCoordinateLabel(x, y)}`;
            }

            // Set ARIA label
            cell.setAttribute('aria-label', ariaLabel);
            cell.setAttribute('data-x', x);
            cell.setAttribute('data-y', y);

            // Add coordinate labels in local mode (chess-style: A1, B2, etc.)
            if (ENV.features.showCoordinates) {
                const colLetter = String.fromCharCode(65 + x); // A, B, C...
                const rowNumber = y + 1; // 1, 2, 3...
                const coordLabel = document.createElement('span');
                coordLabel.className = 'coord-label';
                coordLabel.textContent = `${colLetter}${rowNumber}`;
                cell.appendChild(coordLabel);
            }

            frag.appendChild(cell);
        }
    }
    gridEl.appendChild(frag);
}

/**
 * Update stats display (level and turn counter)
 * @param {HTMLElement} levelDisplay - Level display element
 * @param {HTMLElement} scoreDisplay - Score/turn display element
 * @param {number} level - Current level number (1-based)
 * @param {number} turn - Current turn number
 */
export function updateStats(levelDisplay, scoreDisplay, level, turn) {
    levelDisplay.textContent = `LVL: ${level.toString().padStart(2, '0')}`;
    scoreDisplay.textContent = `TURN: ${turn.toString().padStart(2, '0')}`;
}

/**
 * Adapt grid size to maintain square aspect ratio
 * @param {HTMLElement} gridEl - Grid container element
 */
export function adaptGridSize(gridEl) {
    gridEl.style.height = gridEl.clientWidth + 'px';
}

/**
 * Get coordinate label (chess-style: A1, B2, etc.)
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {string} Coordinate label
 */
function getCoordinateLabel(x, y) {
    const colLetter = String.fromCharCode(65 + x); // A, B, C...
    const rowNumber = y + 1; // 1, 2, 3...
    return `${colLetter}${rowNumber}`;
}
