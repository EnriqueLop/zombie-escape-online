/**
 * Analytics Tracking
 * Wrapper for Google Analytics events
 */

/**
 * Track level start event
 * @param {number} level - Level number
 */
export function trackLevelStart(level) {
    if (typeof trackLevelStart === 'undefined') return;
    if (typeof window.trackLevelStart === 'function') {
        window.trackLevelStart(level);
    }
}

/**
 * Track level completion event
 * @param {number} level - Level number
 * @param {number} moves - Number of moves taken
 * @param {number} traps - Number of traps triggered
 */
export function trackLevelComplete(level, moves, traps) {
    if (typeof window.trackLevelComplete === 'function') {
        window.trackLevelComplete(level, moves, traps);
    }
}

/**
 * Track game over event
 * @param {number} level - Level number
 * @param {number} moves - Number of moves taken
 * @param {string} reason - Reason for game over
 */
export function trackGameOver(level, moves, reason) {
    if (typeof window.trackGameOver === 'function') {
        window.trackGameOver(level, moves, reason);
    }
}

/**
 * Track theme change event
 * @param {string} themeName - Theme name selected
 */
export function trackThemeChange(themeName) {
    if (typeof window.trackThemeChange === 'function') {
        window.trackThemeChange(themeName);
    }
}

/**
 * Track login event
 * @param {string} method - Login method (e.g., 'google')
 */
export function trackLogin(method) {
    if (typeof window.trackLogin === 'function') {
        window.trackLogin(method);
    }
}

/**
 * Track share event
 * @param {number} level - Level number shared
 */
export function trackShare(level) {
    if (typeof window.trackShare === 'function') {
        window.trackShare(level);
    }
}

/**
 * Track music toggle event
 * @param {boolean} enabled - Whether music was enabled or disabled
 */
export function trackMusicToggle(enabled) {
    if (typeof window.trackMusicToggle === 'function') {
        window.trackMusicToggle(enabled);
    }
}
