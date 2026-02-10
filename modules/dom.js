/**
 * DOM Element References
 * Centralized access to all DOM elements used in the game
 */

/**
 * Get all DOM element references
 * Call this after DOM is loaded
 * @returns {object} Object containing all DOM element references
 */
export function getElements() {
    return {
        // Game grid
        grid: document.getElementById('grid'),

        // Status displays
        levelDisplay: document.getElementById('level-display'),
        skinDisplay: document.getElementById('skin-display'),
        scoreDisplay: document.getElementById('score-display'),

        // Message overlay
        msgOverlay: document.getElementById('message-overlay'),
        msgTitle: document.getElementById('message-title'),
        msgSubtitle: document.getElementById('message-subtitle'),

        // Buttons
        buttons: {
            restart: document.getElementById('restart-btn'),
            share: document.getElementById('share-btn'),
            music: document.getElementById('music-btn')
        },

        // Header title (clickable → return to menu)
        headerTitle: document.getElementById('header-title'),

        // Mobile controls
        controls: {
            mobileControls: document.querySelectorAll('.dpad-btn')
        },


        // Menu system
        menu: {
            overlay: document.getElementById('fullscreen-menu-overlay'),
            title: document.getElementById('menu-title'),
            grid: document.getElementById('menu-grid'),
            closeBtn: document.getElementById('menu-close-btn')
        },

        // Intro menu
        intro: {
            container: document.getElementById('intro-menu'),
            mainButtons: document.getElementById('intro-main-buttons'),
            difficultyButtons: document.getElementById('intro-difficulty-buttons'),
            playBtn: document.getElementById('intro-play-btn'),
            skinsBtn: document.getElementById('intro-skins-btn'),
            settingsBtn: document.getElementById('intro-settings-btn'),
            backBtn: document.getElementById('intro-back-btn'),
            tierBtns: document.querySelectorAll('.intro-tier-btn')
        },

        // App container
        app: document.getElementById('app')
    };
}
