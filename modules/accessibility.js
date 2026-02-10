/**
 * Accessibility Module
 * Handles screen reader announcements, keyboard shortcuts, and accessibility features
 */

import { logger } from "../utils/logger.js";

// Screen reader announcer elements
let politeAnnouncer = null;
let assertiveAnnouncer = null;

/**
 * Initialize accessibility features
 */
export function initAccessibility() {
    politeAnnouncer = document.getElementById('sr-announcer');
    assertiveAnnouncer = document.getElementById('sr-announcer-assertive');

    // Load saved preferences
    loadAccessibilityPreferences();

    logger.debug("Accessibility features initialized");
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
    const announcer = priority === 'assertive' ? assertiveAnnouncer : politeAnnouncer;

    if (!announcer) {
        logger.warn("Screen reader announcer not initialized");
        return;
    }

    // Clear and re-set to trigger announcement
    announcer.textContent = '';
    setTimeout(() => {
        announcer.textContent = message;
    }, 100);

    logger.debug("Screen reader announcement:", message);
}

/**
 * Announce game state change
 * @param {number} level - Current level
 * @param {number} turn - Current turn
 * @param {string} status - Game status
 */
export function announceGameState(level, turn, status) {
    announceToScreenReader(`Level ${level}, Turn ${turn}. ${status}`);
}

/**
 * Announce player movement
 * @param {number} dx - X direction
 * @param {number} dy - Y direction
 * @param {boolean} success - Whether move was successful
 */
export function announceMove(dx, dy, success) {
    const direction = getDirectionName(dx, dy);
    if (success) {
        announceToScreenReader(`Moved ${direction}`);
    } else {
        announceToScreenReader(`Cannot move ${direction}. Blocked by wall or boundary.`, 'assertive');
    }
}

/**
 * Announce level start
 * @param {number} level - Level number
 * @param {number} zombieCount - Number of zombies
 */
export function announceLevelStart(level, zombieCount) {
    const zombieText = zombieCount === 1 ? '1 zombie' : `${zombieCount} zombies`;
    announceToScreenReader(`Starting level ${level}. ${zombieText} on the board. Find the exit!`, 'assertive');
}

/**
 * Announce level complete
 * @param {number} level - Level number
 * @param {number} turns - Number of turns taken
 */
export function announceLevelComplete(level, turns) {
    announceToScreenReader(`Level ${level} complete! Reached exit in ${turns} turns.`, 'assertive');
}

/**
 * Announce game over
 * @param {number} level - Level number
 * @param {string} reason - Reason for game over
 */
export function announceGameOver(level, reason) {
    announceToScreenReader(`Game over on level ${level}. ${reason}`, 'assertive');
}

/**
 * Get direction name from dx/dy
 * @param {number} dx - X direction
 * @param {number} dy - Y direction
 * @returns {string} Direction name
 */
function getDirectionName(dx, dy) {
    if (dx === -1) return 'left';
    if (dx === 1) return 'right';
    if (dy === -1) return 'up';
    if (dy === 1) return 'down';
    return 'in place';
}

/**
 * Toggle colorblind mode
 * @param {boolean} enabled - Whether to enable colorblind mode
 */
export function toggleColorblindMode(enabled) {
    if (enabled) {
        document.body.classList.add('colorblind-mode');
        announceToScreenReader('Colorblind mode enabled');
    } else {
        document.body.classList.remove('colorblind-mode');
        announceToScreenReader('Colorblind mode disabled');
    }
    localStorage.setItem('zeo_colorblind', enabled.toString());
}

/**
 * Get colorblind mode preference
 * @returns {boolean} Whether colorblind mode is enabled
 */
export function getColorblindMode() {
    return localStorage.getItem('zeo_colorblind') === 'true';
}

/**
 * Toggle high contrast mode
 * @param {boolean} enabled - Whether to enable high contrast
 */
export function toggleHighContrast(enabled) {
    if (enabled) {
        document.body.classList.add('high-contrast');
        announceToScreenReader('High contrast mode enabled');
    } else {
        document.body.classList.remove('high-contrast');
        announceToScreenReader('High contrast mode disabled');
    }
    localStorage.setItem('zeo_high_contrast', enabled.toString());
}

/**
 * Get high contrast preference
 * @returns {boolean} Whether high contrast is enabled
 */
export function getHighContrast() {
    return localStorage.getItem('zeo_high_contrast') === 'true';
}

/**
 * Toggle reduced motion
 * @param {boolean} enabled - Whether to enable reduced motion
 */
export function toggleReducedMotion(enabled) {
    if (enabled) {
        document.body.classList.add('reduced-motion');
        announceToScreenReader('Reduced motion enabled');
    } else {
        document.body.classList.remove('reduced-motion');
        announceToScreenReader('Reduced motion disabled');
    }
    localStorage.setItem('zeo_reduced_motion', enabled.toString());
}

/**
 * Get reduced motion preference
 * @returns {boolean} Whether reduced motion is enabled
 */
export function getReducedMotion() {
    return localStorage.getItem('zeo_reduced_motion') === 'true';
}

/**
 * Toggle larger text
 * @param {boolean} enabled - Whether to enable larger text
 */
export function toggleLargerText(enabled) {
    if (enabled) {
        document.body.classList.add('larger-text');
        announceToScreenReader('Larger text enabled');
    } else {
        document.body.classList.remove('larger-text');
        announceToScreenReader('Larger text disabled');
    }
    localStorage.setItem('zeo_larger_text', enabled.toString());
}

/**
 * Get larger text preference
 * @returns {boolean} Whether larger text is enabled
 */
export function getLargerText() {
    return localStorage.getItem('zeo_larger_text') === 'true';
}

/**
 * Detect system high contrast preference
 * @returns {boolean} Whether system has high contrast enabled
 */
export function detectHighContrast() {
    return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Detect system reduced motion preference
 * @returns {boolean} Whether system has reduced motion enabled
 */
export function detectReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Load saved accessibility preferences
 */
function loadAccessibilityPreferences() {
    // Auto-detect system preferences if no saved preference
    if (localStorage.getItem('zeo_high_contrast') === null && detectHighContrast()) {
        toggleHighContrast(true);
    } else if (getHighContrast()) {
        document.body.classList.add('high-contrast');
    }

    if (localStorage.getItem('zeo_reduced_motion') === null && detectReducedMotion()) {
        toggleReducedMotion(true);
    } else if (getReducedMotion()) {
        document.body.classList.add('reduced-motion');
    }

    if (getColorblindMode()) {
        document.body.classList.add('colorblind-mode');
    }

    if (getLargerText()) {
        document.body.classList.add('larger-text');
    }
}

/**
 * Get all accessibility settings
 * @returns {object} Object with all accessibility settings
 */
export function getAccessibilitySettings() {
    return {
        colorblind: getColorblindMode(),
        highContrast: getHighContrast(),
        reducedMotion: getReducedMotion(),
        largerText: getLargerText()
    };
}

/**
 * Trap focus within an element (for modals)
 * @param {HTMLElement} container - Container to trap focus in
 * @returns {Function} Cleanup function to remove trap
 */
export function trapFocus(container) {
    const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element
    firstElement.focus();

    // Return cleanup function
    return () => {
        container.removeEventListener('keydown', handleTabKey);
    };
}
