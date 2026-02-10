/**
 * UI Management
 * Handles overlays, menus, and UI interactions
 */

import { SKINS, applySkin } from "../skins.js";
import { trackThemeChange, trackMusicToggle } from "./analytics.js";
import { logger } from "../utils/logger.js";
import {
    toggleColorblindMode,
    getColorblindMode,
    toggleHighContrast,
    getHighContrast,
    toggleReducedMotion,
    getReducedMotion,
    toggleLargerText,
    getLargerText
} from "./accessibility.js";

/**
 * Show game over overlay
 * @param {HTMLElement} msgOverlay - Message overlay element
 * @param {HTMLElement} msgTitle - Message title element
 * @param {HTMLElement} msgSubtitle - Message subtitle element
 * @param {boolean} isWin - True if player won
 * @param {number} level - Current level number
 */
export function showOverlay(msgOverlay, msgTitle, msgSubtitle, isWin, level) {
    msgOverlay.classList.remove('hidden');
    if (isWin) {
        msgTitle.textContent = "SYSTEM SECURED";
        msgTitle.style.color = "var(--player-color)";
        msgSubtitle.textContent = `Completed Level ${level}`;
    } else {
        msgTitle.textContent = "FATAL ERROR";
        msgTitle.style.color = "var(--zombie-color)";
        msgSubtitle.textContent = `Terminated on Level ${level}`;
    }
}

/**
 * Hide game over overlay
 * @param {HTMLElement} msgOverlay - Message overlay element
 */
export function hideOverlay(msgOverlay) {
    msgOverlay.classList.add('hidden');
}

/** Tracks whether menu was opened from intro (so closeMenu returns to intro) */
let _introModeContainer = null;

/**
 * Set intro mode so closeMenu returns to intro instead of #app
 * @param {HTMLElement|null} introContainer - The intro container element, or null to clear
 */
export function setIntroModeForMenu(introContainer) {
    _introModeContainer = introContainer;
}

/**
 * Show the intro menu and hide the game
 * @param {HTMLElement} introContainer - Intro menu element
 * @param {HTMLElement} appContainer - App container element
 * @param {HTMLElement} mainButtons - Main buttons container
 * @param {HTMLElement} difficultyButtons - Difficulty buttons container
 */
export function showIntroMenu(introContainer, appContainer, mainButtons, difficultyButtons) {
    introContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
    // Reset to main buttons view
    mainButtons.classList.remove('hidden');
    difficultyButtons.classList.add('hidden');
}

/**
 * Hide the intro menu and show the game
 * @param {HTMLElement} introContainer - Intro menu element
 * @param {HTMLElement} appContainer - App container element
 */
export function hideIntroMenu(introContainer, appContainer) {
    introContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
}

/**
 * Setup skins menu from intro screen
 * @param {HTMLElement} skinsBtn - Skins button element
 * @param {object} menuElements - Menu DOM elements
 * @param {HTMLElement} introContainer - Intro container element
 * @param {Function} onSkinChange - Callback when skin changes
 */
export function setupIntroSkinsMenu(skinsBtn, menuElements, introContainer, onSkinChange) {
    skinsBtn.addEventListener('click', () => {
        // Hide intro, set intro-mode so close returns to intro
        introContainer.classList.add('hidden');
        _introModeContainer = introContainer;

        const currentId = localStorage.getItem('zeo_skin') || 'neon';

        // Strip ALL theme classes from body so each preview only uses its own theme
        SKINS.forEach(s => document.body.classList.remove(s.class));

        const items = SKINS.map(skin => ({
            id: skin.id,
            title: skin.name,
            description: skin.description,
            active: skin.id === currentId,
            locked: false,
            previewHTML: `
                <div class="skin-preview-cells ${skin.class}">
                    <div class="cell player skin-cell"></div>
                    <div class="cell zombie skin-cell"></div>
                    <div class="cell wall skin-cell"></div>
                    <div class="cell exit skin-cell"></div>
                </div>
            `
        }));

        // Use a dummy appContainer since intro is hidden, not app
        const dummyApp = { style: {} };
        showListMenu(menuElements, dummyApp, "SELECT THEME", items, (selectedId) => {
            applySkin(selectedId);
            localStorage.setItem('zeo_skin', selectedId);

            closeMenu(menuElements.overlay, dummyApp);

            const skin = SKINS.find(s => s.id === selectedId);
            trackThemeChange(skin ? skin.name : selectedId);

            if (onSkinChange) {
                onSkinChange(selectedId);
            }
        });

        // Re-apply skin when menu closes (ESC, close button, click outside)
        const observer = new MutationObserver(() => {
            if (menuElements.overlay.classList.contains('hidden')) {
                applySkin(localStorage.getItem('zeo_skin') || 'neon');
                observer.disconnect();
            }
        });
        observer.observe(menuElements.overlay, { attributes: true, attributeFilter: ['class'] });
    });
}

/**
 * Setup settings/accessibility menu from intro screen
 * @param {HTMLElement} settingsBtn - Settings button element
 * @param {object} menuElements - Menu DOM elements
 * @param {HTMLElement} introContainer - Intro container element
 */
export function setupIntroSettingsMenu(settingsBtn, menuElements, introContainer) {
    settingsBtn.addEventListener('click', () => {
        // Hide intro, set intro-mode so close returns to intro
        introContainer.classList.add('hidden');
        _introModeContainer = introContainer;

        const settings = {
            colorblind: getColorblindMode(),
            highContrast: getHighContrast(),
            reducedMotion: getReducedMotion(),
            largerText: getLargerText()
        };

        const items = [
            {
                id: 'colorblind',
                title: 'Colorblind Mode',
                description: 'Add text labels to game pieces',
                active: settings.colorblind,
                locked: false
            },
            {
                id: 'high-contrast',
                title: 'High Contrast',
                description: 'Increase color contrast',
                active: settings.highContrast,
                locked: false
            },
            {
                id: 'reduced-motion',
                title: 'Reduce Motion',
                description: 'Minimize animations',
                active: settings.reducedMotion,
                locked: false
            },
            {
                id: 'larger-text',
                title: 'Larger Text',
                description: 'Increase text size',
                active: settings.largerText,
                locked: false
            }
        ];

        const dummyApp = { style: {} };
        showListMenu(menuElements, dummyApp, "SETTINGS", items, (selectedId) => {
            switch (selectedId) {
                case 'colorblind':
                    toggleColorblindMode(!settings.colorblind);
                    break;
                case 'high-contrast':
                    toggleHighContrast(!settings.highContrast);
                    break;
                case 'reduced-motion':
                    toggleReducedMotion(!settings.reducedMotion);
                    break;
                case 'larger-text':
                    toggleLargerText(!settings.largerText);
                    break;
            }

            // Refresh menu to show updated state
            setTimeout(() => {
                settingsBtn.click();
            }, 100);
        });
    });
}

/**
 * Show a generic list menu
 * @param {object} menuElements - Object with menu DOM elements
 * @param {object} appContainer - App container element
 * @param {string} title - Menu title
 * @param {Array} items - Array of menu items
 * @param {Function} onSelect - Callback when item selected
 */
export function showListMenu(menuElements, appContainer, title, items, onSelect) {
    const { overlay, titleEl, grid, closeBtn } = menuElements;

    titleEl.textContent = title;
    grid.innerHTML = '';
    overlay.classList.remove('hidden');

    // Hide the game while menu is open
    appContainer.style.visibility = 'hidden';
    appContainer.style.opacity = '0';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = `menu-item ${item.extraClasses || ''} ${item.active ? 'active' : ''} ${item.locked ? 'locked' : ''}`;

        // Add preview (controlled HTML)
        if (item.previewHTML) {
            const preview = document.createElement('div');
            preview.className = 'menu-item-preview';
            preview.innerHTML = item.previewHTML; // Safe: controlled by SKINS constant
            card.appendChild(preview);
        }

        // Add title (text content - XSS safe)
        const title = document.createElement('div');
        title.className = 'menu-item-title';
        title.textContent = item.title; // Use textContent, not innerHTML
        card.appendChild(title);

        // Add description (text content - XSS safe)
        if (item.description) {
            const desc = document.createElement('div');
            desc.className = 'menu-item-desc';
            desc.textContent = item.description; // Use textContent, not innerHTML
            card.appendChild(desc);
        }

        if (!item.locked) {
            card.addEventListener('click', () => {
                onSelect(item.id);
                // Update active state visually without full re-render for speed
                Array.from(grid.children).forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            });
        } else {
            // Future: Show reason for lock or Ad option
        }

        grid.appendChild(card);
    });
}

/**
 * Close the fullscreen menu
 * @param {HTMLElement} menuOverlay - Menu overlay element
 * @param {HTMLElement} appContainer - App container element
 */
export function closeMenu(menuOverlay, appContainer) {
    menuOverlay.classList.add('hidden');
    if (_introModeContainer) {
        _introModeContainer.classList.remove('hidden');
        _introModeContainer = null;
    } else {
        appContainer.style.visibility = 'visible';
        appContainer.style.opacity = '1';
    }
}

/**
 * Setup menu close handlers (ESC key, close button, overlay click)
 * @param {object} menuElements - Menu DOM elements
 * @param {HTMLElement} appContainer - App container element
 */
export function setupMenuHandlers(menuElements, appContainer) {
    const { overlay, closeBtn } = menuElements;

    // Close button
    closeBtn.addEventListener('click', () => closeMenu(overlay, appContainer));

    // Click outside menu
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeMenu(overlay, appContainer);
        }
    });

    // ESC key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
            closeMenu(overlay, appContainer);
        }
    });
}


/**
 * Setup music button
 * @param {HTMLElement} musicBtn - Music button element
 * @param {Function} getSoundManager - Function that returns/initializes sound manager
 */
export function setupMusicButton(musicBtn, getSoundManager) {
    musicBtn.addEventListener('click', () => {
        const soundManager = getSoundManager();

        if (!soundManager) {
            logger.warn("Sound manager not initialized");
            return;
        }

        // Resume context if needed (browsers pause audio contexts if not created on user gesture)
        if (soundManager.ctx && soundManager.ctx.state === 'suspended') {
            soundManager.ctx.resume();
        }

        if (soundManager.isMuted) {
            // Unmute / Play
            soundManager.toggleMute();
            soundManager.startMusic();
            musicBtn.textContent = "MUSIC: ON";
            musicBtn.classList.remove('secondary');
            musicBtn.classList.add('primary');

            trackMusicToggle(true);
        } else {
            // Mute / Stop
            if (!soundManager.initialized) {
                soundManager.startMusic(); // First start
            }
            const isMuted = soundManager.toggleMute();
            if (isMuted) {
                musicBtn.textContent = "MUSIC: OFF";
                musicBtn.classList.remove('primary');
                musicBtn.classList.add('secondary');
            } else {
                musicBtn.textContent = "MUSIC: ON";
                musicBtn.classList.remove('secondary');
                musicBtn.classList.add('primary');
            }

            trackMusicToggle(!isMuted);
        }
    });
}

