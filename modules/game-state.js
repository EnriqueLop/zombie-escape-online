/**
 * Game State Management
 * Wrapper around the GameEngine for state management
 */

import { getLevel, getLevelCount } from "./levels.js";
import { logger } from "../utils/logger.js";

let engine = null;
let currentLevelIdx = 0;

/**
 * Initialize game engine
 * @param {number} width - Grid width
 * @param {number} height - Grid height
 * @returns {boolean} True if initialized successfully
 */
export function initGameState(width = 10, height = 10) {
    // Engine should be loaded via <script src="engine.js">
    if (typeof GameEngine === 'undefined') {
        logger.error("GameEngine not loaded");
        return false;
    }

    engine = new GameEngine(width, height);
    return true;
}

/**
 * Start a level
 * @param {number} levelNumber - Level number (1-based)
 * @returns {boolean} True if level started successfully
 */
export function startLevel(levelNumber) {
    if (!engine) {
        logger.error("Game engine not initialized");
        return false;
    }

    // If saved level exceeds available levels, reset to level 1
    if (levelNumber > getLevelCount()) {
        levelNumber = 1;
    }

    currentLevelIdx = levelNumber - 1;
    const levelData = getLevel(levelNumber);

    if (!levelData) {
        logger.error("Invalid level number", levelNumber);
        return false;
    }

    engine.loadLevel(levelData);
    return true;
}

/**
 * Start a level directly from a layout array (for tier/endless mode)
 * @param {string[]} layout - Level grid layout
 * @returns {boolean} True if level started successfully
 */
export function startLevelFromLayout(layout) {
    if (!engine) {
        logger.error("Game engine not initialized");
        return false;
    }

    currentLevelIdx = -1; // Signals tier/endless mode
    engine.loadLevel(layout);
    return true;
}

/**
 * Move player in specified direction
 * @param {number} dx - X direction (-1, 0, 1)
 * @param {number} dy - Y direction (-1, 0, 1)
 * @returns {object} Result object with {moved, status}
 */
export function movePlayer(dx, dy) {
    if (!engine) {
        logger.error("Game engine not initialized");
        return { moved: false, status: 'error' };
    }

    return engine.movePlayer(dx, dy);
}

/**
 * Get current level index (0-based)
 * @returns {number} Current level index
 */
export function getCurrentLevelIndex() {
    return currentLevelIdx;
}

/**
 * Get current level number (1-based)
 * @returns {number} Current level number
 */
export function getCurrentLevelNumber() {
    return currentLevelIdx + 1;
}

/**
 * Get current game state
 * @returns {object|null} Current state from engine
 */
export function getGameState() {
    return engine ? engine.state : null;
}

/**
 * Check if game is over
 * @returns {boolean} True if game is over
 */
export function isGameOver() {
    return engine ? engine.state.isGameOver : false;
}

/**
 * Get the raw engine instance
 * @returns {object|null} Game engine instance
 */
export function getEngine() {
    return engine;
}

/**
 * Get engine dimensions
 * @returns {object} {width, height}
 */
export function getEngineDimensions() {
    if (!engine) return { width: 10, height: 10 };
    return {
        width: engine.width,
        height: engine.height
    };
}

/**
 * Check if position is a wall
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if position is a wall
 */
export function isWall(x, y) {
    return engine ? engine.isWall(x, y) : false;
}
