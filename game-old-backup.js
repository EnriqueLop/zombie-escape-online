/**
 * Zombie Escape Online
 * Frontend Controller with Firebase Auth
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, connectAuthEmulator }
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, connectFirestoreEmulator, increment }
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { SKINS, applySkin } from "./skins.js";
import { logger } from "./utils/logger.js";
import { ENV } from "./utils/env.js";

// --- Firebase Init ---
let app, auth, db, user;

async function initFirebase() {
    try {
        let config;

        if (ENV.firebase.useEmulators) {
            // Mock config for emulators
            config = {
                apiKey: "fake-api-key",
                authDomain: "zombie-escape-online.firebaseapp.com",
                projectId: "zombie-escape-online",
                storageBucket: "zombie-escape-online.appspot.com",
                messagingSenderId: "123456789",
                appId: "1:123456789:web:123456"
            };
        } else {
            const res = await fetch('/__/firebase/init.json');
            config = await res.json();
        }

        app = initializeApp(config);
        auth = getAuth(app);
        db = getFirestore(app);

        if (ENV.firebase.useEmulators) {
            logger.debug("Connecting to Firebase Emulators");
            connectAuthEmulator(auth, `http://localhost:${ENV.firebase.emulatorPorts.auth}`);
            connectFirestoreEmulator(db, 'localhost', ENV.firebase.emulatorPorts.firestore);
        }

        setupAuthListeners();
    } catch (e) {
        logger.warn("Firebase initialization skipped", e);
        // Fallback or just ignore if on localhost without emulation
    }
}

// --- Levels ---
const LEVELS = [
    // Level 1: The Hallway (Tutorial)
    // Very Easy: Player starts near exit. Zombie trapped behind wall for a bit.
    [
        "##########",
        "#P..E....#",
        "#######..#",
        "#........#",
        "#........#",
        "#.....Z..#",
        "#........#",
        "#........#",
        "##########",
        "##########"
    ],
    // Level 2: Generated (Easy - Steps: 7, Traps: 7)
    [
        "..........",
        "......##..",
        "..........",
        "#.P#...E..",
        "....#..##.",
        "...#..#..#",
        "......#...",
        "......##.#",
        "..#...##..",
        "........Z."
    ],
    // Level 3: Generated (Medium - Steps: 8, Traps: 13)
    [
        "..#.....#.",
        ".......Z..",
        "......#...",
        "#..#...#.#",
        ".#....#...",
        "..........",
        "..P..#....",
        ".##...#E.#",
        ".#.#......",
        "...##.#.#."
    ],
    // Level 4: Generated (Medium - Steps: 11, Traps: 17)
    [
        ".....#.#..",
        "#......##.",
        "..........",
        "....#.Z...",
        ".#.#.#..#.",
        "P...#...#.",
        "...#...#..",
        ".......##.",
        "........#E",
        "....#....."
    ],
    // Level 5: Generated (Hard - Steps: 16, Traps: 16)
    [
        "....###...",
        ".#.......#",
        "..#.......",
        "P..#..#.#.",
        "##.....Z..",
        "..........",
        "......#...",
        ".....#..#.",
        ".###.....E",
        ".#...#...."
    ],
    // Level 6: Generated (Expert - Steps: 16, Traps: 35)
    [
        "P..#.##..#",
        "#..#...#..",
        ".......#..",
        "..##.....#",
        ".#..#.....",
        "......#...",
        "....Z.....",
        "....#..#Z.",
        "#.........",
        ".........E"
    ]
];

// --- State ---
let engine;
let currentLevelIdx = 0;

// --- DOM Elements ---
const gridEl = document.getElementById('grid');
const levelDisplay = document.getElementById('level-display');
const scoreDisplay = document.getElementById('score-display');
const msgOverlay = document.getElementById('message-overlay');
const msgTitle = document.getElementById('message-title');
const msgSubtitle = document.getElementById('message-subtitle');
const restartBtn = document.getElementById('restart-btn');
const shareBtn = document.getElementById('share-btn');
const mobileControls = document.querySelectorAll('.dpad-btn');
// Auth UI
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userDisplay = document.getElementById('user-display');
const authContainer = document.getElementById('auth-container');
const skinsBtn = document.getElementById('skins-btn');
const musicBtn = document.getElementById('music-btn');

// --- Initialization ---

let soundManager;

async function initGame() {
    // Engine should be loaded via <script src="engine.js">
    if (typeof GameEngine === 'undefined') {
        logger.error("GameEngine not loaded");
        return;
    }

    engine = new GameEngine(10, 10);

    // FORCE RANDOM ON RELOAD (User Request)
    const randomSkinIndex = Math.floor(Math.random() * SKINS.length);
    const startSkin = SKINS[randomSkinIndex].id;
    logger.debug("Initial skin:", startSkin);

    applySkin(startSkin);

    // Resize listener
    window.addEventListener('resize', adaptGridSize);
    adaptGridSize();

    await initFirebase();

    // If not logged in, just start level 1. If logged in, auth listener will trigger load.
    if (!user) {
        startLevel(1);
    }

    setupInput();
}

function adaptGridSize() {
    gridEl.style.height = gridEl.clientWidth + 'px';
}

function startLevel(lvl) {
    // If saved level exceeds available levels, reset to level 1
    if (lvl > LEVELS.length) {
        lvl = 1;
    }

    currentLevelIdx = lvl - 1;
    engine.loadLevel(LEVELS[currentLevelIdx]);

    // Update Grid CSS
    gridEl.style.gridTemplateColumns = `repeat(${engine.width}, 1fr)`;
    gridEl.style.gridTemplateRows = `repeat(${engine.height}, 1fr)`;

    render();
    updateStats();
    hideOverlay();

    // Analytics: Track level start
    if (typeof trackLevelStart === 'function') {
        trackLevelStart(currentLevelIdx + 1);
    }
}

function handleInput(dx, dy) {
    const result = engine.movePlayer(dx, dy);

    if (result.moved) {
        render();
        updateStats();

        if (result.status === 'won') {
            levelComplete();
        } else if (result.status === 'lost') {
            // Analytics: Track game over
            if (typeof trackGameOver === 'function') {
                trackGameOver(currentLevelIdx + 1, engine.state.turn, 'caught_by_enemy');
            }
            showOverlay(false);
        }
    }
}

function levelComplete() {
    // Analytics: Track level completion
    if (typeof trackLevelComplete === 'function') {
        trackLevelComplete(currentLevelIdx + 1, engine.state.turn, 0); // traps: 0 for now
    }

    // Save Progress if logged in
    const nextLevel = currentLevelIdx + 2;
    if (user && db) {
        saveProgress(nextLevel);
    }

    setTimeout(() => {
        startLevel(nextLevel);
    }, 500);
}

// --- Auth Logic ---

function setupAuthListeners() {
    onAuthStateChanged(auth, async (u) => {
        if (u) {
            // User is signed in
            user = u;
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            userDisplay.textContent = `AGENT: ${u.displayName || 'Player'}`;
            userDisplay.classList.remove('hidden');

            // Load Progress
            await loadProgress();
        } else {
            // User is signed out
            user = null;
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            userDisplay.classList.add('hidden');
        }
    });

    loginBtn.addEventListener('click', () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then(() => {
                // Analytics: Track login
                if (typeof trackLogin === 'function') {
                    trackLogin('google');
                }
            })
            .catch(e => console.error("Login failed:", e.code || e.message));
    });

    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            // Optional: Reset to level 1 on logout?
            // startLevel(1);
        });
    });
}

async function saveProgress(level) {
    try {
        const userRef = doc(db, 'users', user.uid);
        // We only save if method is strictly greater? Or always save to enable "resume last played"?
        // Let's check max level logic if needed, but for now simple overwrite "current save".
        // Actually, let's keep max level logic so replaying Lvl 1 doesn't reset progress?
        // But user asked "start where they left off". So simple overwrite is correct for "resume".

        // However, we might want to verify we don't overwrite with a lower level if they replay?
        // Let's overwrite. If they replay level 1, they are at level 1.

        // Wait, better UX: use setDoc with merge or check existing?
        // Simplest MVP: Just save the level they just unlocked.

        // Check current saved level to avoid overwriting high score?
        // User request: "start by the level they touch".

        // Let's do: Save MAX level reached.
        const snap = await getDoc(userRef);
        let currentMax = 0;
        if (snap.exists()) {
            currentMax = snap.data().level || 0;
        }

        if (level > currentMax) {
            await setDoc(userRef, {
                level: level,
                lastPlayed: new Date(),
                email: user.email,
                name: user.displayName || 'Anonymous'
            }, { merge: true });
            logger.info("Progress saved", level);
        }
    } catch (e) {
        logger.error("Error saving progress", e);
    }
}

async function loadProgress() {
    try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            if (data.skin) {
                applySkin(data.skin);
                localStorage.setItem('zeo_skin', data.skin);
            }
            if (data.level && data.level > 1) {
                logger.info("Resuming from level", data.level);
                startLevel(data.level);
            }
        }
    } catch (e) {
        logger.error("Error loading progress", e);
    }
}

// --- Rendering ---

function render() {
    gridEl.innerHTML = '';
    const state = engine.state;

    const frag = document.createDocumentFragment();

    for (let y = 0; y < engine.height; y++) {
        for (let x = 0; x < engine.width; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';

            // Add classes for entities
            if (x === state.player.x && y === state.player.y) {
                cell.classList.add('player');
            } else if (state.zombies.some(z => z.x === x && z.y === y)) {
                cell.classList.add('zombie');
            } else if (engine.isWall(x, y)) {
                cell.classList.add('wall');
            } else if (state.exit.x === x && state.exit.y === y) {
                cell.classList.add('exit');
            }

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

function updateStats() {
    levelDisplay.textContent = `LVL: ${(currentLevelIdx + 1).toString().padStart(2, '0')}`;
    scoreDisplay.textContent = `TURN: ${engine.state.turn.toString().padStart(2, '0')}`;
}

// --- UI / Overlay ---

function showOverlay(win) {
    msgOverlay.classList.remove('hidden');
    if (win) {
        msgTitle.textContent = "SYSTEM SECURED";
        msgTitle.style.color = "var(--player-color)";
        msgSubtitle.textContent = `Completed Level ${currentLevelIdx + 1}`;
    } else {
        msgTitle.textContent = "FATAL ERROR";
        msgTitle.style.color = "var(--zombie-color)";
        msgSubtitle.textContent = `Terminated on Level ${currentLevelIdx + 1}`;
    }
}

function hideOverlay() {
    msgOverlay.classList.add('hidden');
}

// --- Inputs ---

function setupInput() {
    window.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp': handleInput(0, -1); break;
            case 'ArrowDown': handleInput(0, 1); break;
            case 'ArrowLeft': handleInput(-1, 0); break;
            case 'ArrowRight': handleInput(1, 0); break;
            case 'n': case 'N': levelComplete(); break; // Cheat: Skip Level
        }
    });

    mobileControls.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const dir = btn.dataset.dir;
            if (dir === 'up') handleInput(0, -1);
            if (dir === 'down') handleInput(0, 1);
            if (dir === 'left') handleInput(-1, 0);
            if (dir === 'right') handleInput(1, 0);
        });
    });

    restartBtn.addEventListener('click', () => {
        // Restart current level instead of level 1
        startLevel(currentLevelIdx + 1);
    });

    shareBtn.addEventListener('click', shareResult);

    // Audio Controls
    musicBtn.addEventListener('click', () => {
        if (!soundManager) {
            soundManager = new SoundManager();
            soundManager.init();
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

            // Analytics: Track music toggle
            if (typeof trackMusicToggle === 'function') {
                trackMusicToggle(true);
            }
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

            // Analytics: Track music toggle
            if (typeof trackMusicToggle === 'function') {
                trackMusicToggle(!isMuted);
            }
        }
    });

    // Generic Menu Elements
    const menuOverlay = document.getElementById('fullscreen-menu-overlay');
    const menuTitle = document.getElementById('menu-title');
    const menuGrid = document.getElementById('menu-grid');
    const menuCloseBtn = document.getElementById('menu-close-btn');
    const appContainer = document.getElementById('app');

    // Close Menu Handler - Restore game view
    const closeMenu = () => {
        menuOverlay.classList.add('hidden');
        // Show the game again
        appContainer.style.visibility = 'visible';
        appContainer.style.opacity = '1';
    };

    // Open Menu Handler - Hide game view
    const openMenu = () => {
        menuOverlay.classList.remove('hidden');
        // Hide the game while menu is open
        appContainer.style.visibility = 'hidden';
        appContainer.style.opacity = '0';
    };

    menuCloseBtn.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', (e) => {
        if (e.target === menuOverlay) closeMenu();
    });

    // ESC key also closes menu
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !menuOverlay.classList.contains('hidden')) {
            closeMenu();
        }
    });

    // Reusable List Menu Renderer
    function showListMenu(title, items, onSelect) {
        menuTitle.textContent = title;
        menuGrid.innerHTML = '';
        openMenu();

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
                    Array.from(menuGrid.children).forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                });
            } else {
                // Future: Show reason for lock or Ad option
            }

            menuGrid.appendChild(card);
        });
    }

    // Skins Menu Trigger
    skinsBtn.addEventListener('click', () => {
        const currentId = localStorage.getItem('zeo_skin') || 'neon';

        // Map skins to generic items
        const items = SKINS.map(skin => ({
            id: skin.id,
            title: skin.name,
            description: skin.description,
            active: skin.id === currentId,
            locked: false, // Future: Check unlocks
            extraClasses: skin.class, // For CSS variables to work in preview
            // Preview parts show: Background, Player, Zombie, Wall
            previewHTML: `
                <div class="preview-part"></div>
                <div class="preview-part"></div>
                <div class="preview-part"></div>
                <div class="preview-part"></div>
            `
        }));

        showListMenu("SELECT THEME", items, (selectedId) => {
            applySkin(selectedId);
            localStorage.setItem('zeo_skin', selectedId);

            // Analytics: Track theme change
            if (typeof trackThemeChange === 'function') {
                const skin = SKINS.find(s => s.id === selectedId);
                trackThemeChange(skin ? skin.name : selectedId);
            }

            if (user && db) {
                saveProgress(currentLevelIdx + 1);
            }
        });
    });
}

function shareResult() {
    let outcome = engine.state.isGameOver && engine.state.status === 'won' ? 'ESCAPED' : 'KILLED';
    let text = `Zombie Escape Online 💀\nLvl ${currentLevelIdx + 1} - ${outcome}\nTurn ${engine.state.turn}\n\n`;
    let gridStr = 'Play: zombie-escape-online.com';
    // Add grid render if needed later, kept simple for now

    navigator.clipboard.writeText(text + gridStr).then(() => {
        // Analytics: Track share
        if (typeof trackShare === 'function') {
            trackShare(currentLevelIdx + 1);
        }

        const originalText = shareBtn.textContent;
        shareBtn.textContent = "COPIED!";
        setTimeout(() => shareBtn.textContent = originalText, 2000);
    });
}

// Start
initGame();

// Production validation (development only)
if (ENV.isDevelopment) {
    import('./utils/production-check.js').then(({ validateProduction }) => {
        validateProduction();
    });
}
