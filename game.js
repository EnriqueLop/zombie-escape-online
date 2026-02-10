/**
 * Zombie Escape Online
 * Main Application Controller
 */

// Modules
import { initFirebase, setupAuth, getCurrentUser, saveProgress, loadProgress, saveSkinPreference, getDb, collection, getDocs } from "./modules/firebase.js";
import { getLevelCount, loadLevelsFromFirestore, getRandomLevelFromTier, hasLevels } from "./modules/levels.js";
import { initGameState, startLevel, startLevelFromLayout, movePlayer, getCurrentLevelNumber, getGameState, getEngineDimensions, isWall } from "./modules/game-state.js";
import { getElements } from "./modules/dom.js";
import { renderGrid, updateStats, adaptGridSize } from "./modules/renderer.js";
import { setupKeyboardInput, setupMobileInput, setupSwipeInput, setupRestartButton, setupShareButton } from "./modules/input.js";
import { showOverlay, hideOverlay, setupMenuHandlers, showIntroMenu, hideIntroMenu, setupIntroSkinsMenu, setupIntroSettingsMenu, setupMusicButton } from "./modules/ui.js";
import { trackLevelStart, trackLevelComplete, trackGameOver } from "./modules/analytics.js";
import {
    initAccessibility,
    announceToScreenReader,
    announceMove,
    announceLevelStart,
    announceLevelComplete,
    announceGameOver
} from "./modules/accessibility.js";
import { initPrivacy } from "./modules/privacy.js";

// Existing modules
import { SKINS, applySkin } from "./skins.js";
import { SoundManager } from "./audio.js";
import { ENV } from "./utils/env.js";
import { logger } from "./utils/logger.js";

// DOM elements
let elements;

// Sound manager (loaded from audio.js)
let soundManager;

// Current tier for endless mode (null = sequential/indexed mode)
let currentTier = null;

// Current level layout (for retrying the same level on death)
let currentLayout = null;

/**
 * Transpose a layout (swap rows and columns)
 * @param {string[]} layout - Original layout
 * @returns {string[]} Transposed layout
 */
function transposeLayout(layout) {
    const rows = layout.length;
    const cols = layout[0].length;
    const result = [];
    for (let x = 0; x < cols; x++) {
        let row = '';
        for (let y = 0; y < rows; y++) {
            row += layout[y][x];
        }
        result.push(row);
    }
    return result;
}

/**
 * Transpose layout if grid orientation doesn't match screen orientation.
 * Puts the grid's longer axis along the screen's longer axis.
 * @param {string[]} layout - Original layout
 * @returns {string[]} Possibly transposed layout
 */
function fitLayoutToScreen(layout) {
    const gridW = layout[0].length;
    const gridH = layout.length;
    if (gridW === gridH) return layout;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    if (screenW === screenH) return layout;

    const gridIsWide = gridW > gridH;
    const screenIsWide = screenW > screenH;

    if (gridIsWide !== screenIsWide) {
        return transposeLayout(layout);
    }
    return layout;
}

/**
 * Build the /play URL with current tier and skin
 */
function buildPlayUrl() {
    const skinId = localStorage.getItem('zeo_skin') || 'neon';
    return `/play?tier=${currentTier}&skin=${skinId}`;
}

/**
 * Replace the current URL with updated params (no new history entry)
 */
function updatePlayUrl() {
    if (currentTier && window.location.pathname === '/play') {
        history.replaceState({ tier: currentTier }, '', buildPlayUrl());
    }
}

/**
 * Initialize the game
 */
async function initGame() {
    // Get DOM elements
    elements = getElements();

    // Initialize accessibility features
    initAccessibility();

    // Initialize privacy & cookie consent
    initPrivacy();

    // Initialize game engine
    if (!initGameState(10, 10)) {
        return; // GameEngine not loaded
    }

    // Set random skin on load
    const randomSkinIndex = Math.floor(Math.random() * SKINS.length);
    const startSkin = SKINS[randomSkinIndex].id;
    logger.debug("Initial skin:", startSkin);
    applySkin(startSkin);
    localStorage.setItem('zeo_skin', startSkin);

    // Resize listener
    window.addEventListener('resize', () => adaptGridSize(elements.grid));
    adaptGridSize(elements.grid);

    // Initialize Firebase
    await initFirebase();

    // Load levels from Firestore (required)
    const levelsLoaded = await loadLevelsFromFirestore(getDb(), collection, getDocs);
    if (!levelsLoaded) {
        logger.error("Failed to load levels from database");
    }

    // Silent auth (no UI buttons, just background skin loading)
    setupSilentAuth();

    // Setup input handlers
    setupInputHandlers();

    // Setup UI handlers
    setupUIHandlers();

    // Setup intro menu handlers
    setupIntroHandlers();

    // Handle popstate (browser back/forward)
    window.addEventListener('popstate', () => {
        if (window.location.pathname === '/play') {
            const tier = new URLSearchParams(window.location.search).get('tier');
            if (tier) {
                startRandomFromTier(tier, false);
            }
        } else {
            navigateToMenu(false);
        }
    });

    // Announce game ready
    setTimeout(() => {
        announceToScreenReader("Zombie Escape Online loaded. Use the menu to select difficulty and start playing.");
    }, 1000);

    // Route based on current URL
    if (window.location.pathname === '/play') {
        const params = new URLSearchParams(window.location.search);
        const tier = params.get('tier');
        const skinParam = params.get('skin');
        if (skinParam && SKINS.find(s => s.id === skinParam)) {
            applySkin(skinParam);
            localStorage.setItem('zeo_skin', skinParam);
        }
        if (tier) {
            startRandomFromTier(tier, false);
        } else {
            showIntroMenu(
                elements.intro.container,
                elements.app,
                elements.intro.mainButtons,
                elements.intro.difficultyButtons
            );
        }
    } else {
        showIntroMenu(
            elements.intro.container,
            elements.app,
            elements.intro.mainButtons,
            elements.intro.difficultyButtons
        );
    }
}

/**
 * Setup silent authentication (background only, no UI buttons)
 */
function setupSilentAuth() {
    setupAuth(async (user) => {
        if (user) {
            // Load saved skin preference
            const data = await loadProgress(user.uid);
            if (data && data.skin) {
                applySkin(data.skin);
                localStorage.setItem('zeo_skin', data.skin);
            }
        }
    });
}

/**
 * Setup intro menu handlers
 */
function setupIntroHandlers() {
    const { intro } = elements;

    // PLAY button → show difficulty picker
    intro.playBtn.addEventListener('click', () => {
        intro.mainButtons.classList.add('hidden');
        intro.difficultyButtons.classList.remove('hidden');
    });

    // BACK button → return to main buttons
    intro.backBtn.addEventListener('click', () => {
        intro.difficultyButtons.classList.add('hidden');
        intro.mainButtons.classList.remove('hidden');
    });

    // Tier buttons → start random level from tier
    intro.tierBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tier = btn.dataset.tier;
            startRandomFromTier(tier);
        });
    });

    // SKINS button
    const menuElements = {
        overlay: elements.menu.overlay,
        titleEl: elements.menu.title,
        grid: elements.menu.grid,
        closeBtn: elements.menu.closeBtn
    };

    setupIntroSkinsMenu(
        intro.skinsBtn,
        menuElements,
        intro.container,
        (skinId) => {
            const user = getCurrentUser();
            if (user) {
                saveSkinPreference(user.uid, skinId);
            }
        }
    );

    // SETTINGS button
    setupIntroSettingsMenu(
        intro.settingsBtn,
        menuElements,
        intro.container
    );
}

/**
 * Start a random level from a specific difficulty tier
 * @param {string} tier - Difficulty tier name
 * @param {boolean} [pushHistory=true] - Whether to push to browser history
 */
function startRandomFromTier(tier, pushHistory = true) {
    const layout = getRandomLevelFromTier(tier);
    if (!layout) {
        logger.error("No levels available for tier:", tier);
        return;
    }

    currentTier = tier;
    currentLayout = layout;

    const fitted = fitLayoutToScreen(layout);
    if (!startLevelFromLayout(fitted)) {
        logger.error("Failed to start level from tier:", tier);
        return;
    }

    // Update URL
    if (pushHistory) {
        history.pushState({ tier }, '', buildPlayUrl());
    }

    // Hide intro, show game
    hideIntroMenu(elements.intro.container, elements.app);

    // Update grid CSS
    const { width, height } = getEngineDimensions();
    elements.grid.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    elements.grid.style.gridTemplateRows = `repeat(${height}, 1fr)`;

    // Re-adapt grid size now that #app is visible
    adaptGridSize(elements.grid);

    render();
    hideOverlay(elements.msgOverlay);

    // Analytics
    trackLevelStart(tier);

    // Announce
    const state = getGameState();
    const zombieCount = state.zombies.length;
    announceToScreenReader(`Starting ${tier} level with ${zombieCount} ${zombieCount === 1 ? 'zombie' : 'zombies'}.`);
}

/**
 * Setup input handlers
 */
function setupInputHandlers() {
    // Keyboard
    setupKeyboardInput(handleMove, handleLevelComplete, randomizeSkin, handleRestart, handleChangeDifficulty);

    // Mobile controls (D-pad + swipe on grid)
    setupMobileInput(elements.controls.mobileControls, handleMove);
    setupSwipeInput(elements.grid, handleMove);

    // Restart button
    setupRestartButton(elements.buttons.restart, handleRestart);

    // Share button
    setupShareButton(elements.buttons.share, () => {
        const state = getGameState();
        return {
            level: currentTier ? currentTier.toUpperCase() : getCurrentLevelNumber(),
            status: state.status,
            turn: state.turn
        };
    });
}

/**
 * Setup UI handlers
 */
function setupUIHandlers() {
    // Menu system
    const menuElements = {
        overlay: elements.menu.overlay,
        titleEl: elements.menu.title,
        grid: elements.menu.grid,
        closeBtn: elements.menu.closeBtn
    };

    setupMenuHandlers(menuElements, elements.app);

    // Header title click → return to menu
    elements.headerTitle.addEventListener('click', () => navigateToMenu(true));
    elements.headerTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigateToMenu(true);
        }
    });

    // Music button - Pass lazy initializer
    setupMusicButton(elements.buttons.music, () => {
        if (!soundManager) {
            soundManager = new SoundManager();
            soundManager.init();
        }
        return soundManager;
    });
}

/**
 * Load and start a level (sequential/indexed mode)
 * @param {number} levelNumber - Level number (1-based)
 */
function loadLevel(levelNumber) {
    // If level exceeds available levels, reset to 1
    if (levelNumber > getLevelCount()) {
        levelNumber = 1;
    }

    if (!startLevel(levelNumber)) {
        logger.error("Failed to start level", levelNumber);
        return;
    }

    // Update grid CSS
    const { width, height } = getEngineDimensions();
    elements.grid.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    elements.grid.style.gridTemplateRows = `repeat(${height}, 1fr)`;

    render();
    hideOverlay(elements.msgOverlay);

    // Analytics
    trackLevelStart(getCurrentLevelNumber());

    // Announce level start
    const state = getGameState();
    const zombieCount = state.zombies.length;
    announceLevelStart(getCurrentLevelNumber(), zombieCount);
}

/**
 * Handle player movement
 * @param {number} dx - X direction
 * @param {number} dy - Y direction
 */
function handleMove(dx, dy) {
    // Guard: don't process moves when intro is visible
    if (!elements.intro.container.classList.contains('hidden')) {
        return;
    }

    const result = movePlayer(dx, dy);

    // Announce move result
    announceMove(dx, dy, result.moved);

    if (result.moved) {
        render();

        if (result.status === 'won') {
            handleLevelComplete();
        } else if (result.status === 'lost') {
            // Analytics
            const state = getGameState();
            const levelLabel = currentTier ? currentTier : getCurrentLevelNumber();
            trackGameOver(levelLabel, state.turn, 'caught_by_enemy');

            // Announce game over
            announceGameOver(levelLabel, 'Caught by zombie');

            // Auto-restart after brief pause
            setTimeout(() => handleRestart(), 1500);
        }
    }
}

/**
 * Handle level completion
 */
function handleLevelComplete() {
    const state = getGameState();
    const levelLabel = currentTier ? currentTier : getCurrentLevelNumber();

    // Announce level complete
    announceLevelComplete(levelLabel, state.turn);

    // Analytics
    trackLevelComplete(levelLabel, state.turn, 0);

    // Save progress (only in indexed mode)
    if (!currentTier) {
        const user = getCurrentUser();
        const nextLevel = getCurrentLevelNumber() + 1;
        if (user) {
            saveProgress(user.uid, nextLevel, user.displayName, user.email);
        }
    }

    // Start next level after short delay
    setTimeout(() => {
        if (currentTier) {
            startRandomFromTier(currentTier);
        } else {
            loadLevel(getCurrentLevelNumber() + 1);
        }
    }, 500);
}

/**
 * Render the game grid
 */
function render() {
    const state = getGameState();
    const { width, height } = getEngineDimensions();

    renderGrid(elements.grid, state, width, height, isWall);

    if (currentTier) {
        updateStats(
            elements.levelDisplay,
            elements.scoreDisplay,
            currentTier.toUpperCase(),
            state.turn
        );
    } else {
        updateStats(
            elements.levelDisplay,
            elements.scoreDisplay,
            getCurrentLevelNumber(),
            state.turn
        );
    }

    updateSkinDisplay();
}

/**
 * Update the skin name in the stats bar
 */
function updateSkinDisplay() {
    const skinId = localStorage.getItem('zeo_skin') || 'neon';
    const skin = SKINS.find(s => s.id === skinId);
    elements.skinDisplay.textContent = `SKIN: ${skin ? skin.name.toUpperCase() : skinId.toUpperCase()}`;
}

/**
 * Navigate back to the intro menu
 * @param {boolean} [pushHistory=true] - Whether to push to browser history
 */
function navigateToMenu(pushHistory = true) {
    currentTier = null;
    if (pushHistory) {
        history.pushState(null, '', '/');
    }
    showIntroMenu(
        elements.intro.container,
        elements.app,
        elements.intro.mainButtons,
        elements.intro.difficultyButtons
    );
}

/**
 * Show difficulty picker (navigate to menu with difficulty buttons visible)
 */
function handleChangeDifficulty() {
    currentTier = null;
    history.pushState(null, '', '/');
    elements.intro.container.classList.remove('hidden');
    elements.app.classList.add('hidden');
    // Show difficulty buttons directly (skip main buttons)
    elements.intro.mainButtons.classList.add('hidden');
    elements.intro.difficultyButtons.classList.remove('hidden');
}

/**
 * Restart the current level
 */
function handleRestart() {
    if (currentLayout) {
        const fitted = fitLayoutToScreen(currentLayout);
        startLevelFromLayout(fitted);
        const { width, height } = getEngineDimensions();
        elements.grid.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        elements.grid.style.gridTemplateRows = `repeat(${height}, 1fr)`;
        adaptGridSize(elements.grid);
        render();
        hideOverlay(elements.msgOverlay);
    } else {
        loadLevel(getCurrentLevelNumber());
    }
}

/**
 * Apply a random skin
 */
function randomizeSkin() {
    const idx = Math.floor(Math.random() * SKINS.length);
    const skin = SKINS[idx];
    applySkin(skin.id);
    localStorage.setItem('zeo_skin', skin.id);
    updateSkinDisplay();
    updatePlayUrl();
}

// Start the game
initGame();

// Production validation (development only)
if (ENV.isDevelopment) {
    import('./utils/production-check.js').then(({ validateProduction }) => {
        validateProduction();
    });
}
