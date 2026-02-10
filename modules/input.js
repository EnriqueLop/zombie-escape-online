/**
 * Input Handling
 * Manages keyboard and mobile touch controls
 */

import { trackShare } from "./analytics.js";

/**
 * Setup keyboard input handlers
 * @param {Function} onMove - Callback(dx, dy) when arrow keys pressed
 * @param {Function} onCheatSkip - Callback when skip level cheat activated
 */
export function setupKeyboardInput(onMove, onCheatSkip, onRandomSkin, onRestart, onChangeDifficulty) {
    window.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp':
                onMove(0, -1);
                break;
            case 'ArrowDown':
                onMove(0, 1);
                break;
            case 'ArrowLeft':
                onMove(-1, 0);
                break;
            case 'ArrowRight':
                onMove(1, 0);
                break;
            case 'n':
            case 'N':
                // Cheat: Skip Level
                if (onCheatSkip) {
                    onCheatSkip();
                }
                break;
            case 's':
            case 'S':
                if (onRandomSkin) {
                    onRandomSkin();
                }
                break;
            case 'r':
            case 'R':
                if (onRestart) {
                    onRestart();
                }
                break;
            case 'l':
            case 'L':
                if (onChangeDifficulty) {
                    onChangeDifficulty();
                }
                break;
        }
    });
}

/**
 * Setup mobile D-pad controls
 * @param {NodeList} mobileControls - D-pad button elements
 * @param {Function} onMove - Callback(dx, dy) when button pressed
 */
export function setupMobileInput(mobileControls, onMove) {
    mobileControls.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const dir = btn.dataset.dir;
            if (dir === 'up') onMove(0, -1);
            if (dir === 'down') onMove(0, 1);
            if (dir === 'left') onMove(-1, 0);
            if (dir === 'right') onMove(1, 0);
        });
    });
}

/**
 * Setup swipe gesture input on a target element
 * @param {HTMLElement} target - Element to listen for swipes (e.g. grid)
 * @param {Function} onMove - Callback(dx, dy) when swipe detected
 */
export function setupSwipeInput(target, onMove) {
    let startX = 0;
    let startY = 0;
    const MIN_SWIPE = 30;

    target.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
    }, { passive: true });

    target.addEventListener('touchend', (e) => {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;

        if (Math.abs(dx) < MIN_SWIPE && Math.abs(dy) < MIN_SWIPE) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            onMove(dx > 0 ? 1 : -1, 0);
        } else {
            onMove(0, dy > 0 ? 1 : -1);
        }
    }, { passive: true });
}

/**
 * Setup restart button
 * @param {HTMLElement} restartBtn - Restart button element
 * @param {Function} onRestart - Callback when restart clicked
 */
export function setupRestartButton(restartBtn, onRestart) {
    restartBtn.addEventListener('click', onRestart);
}

/**
 * Setup share button
 * @param {HTMLElement} shareBtn - Share button element
 * @param {Function} getShareData - Callback that returns share data
 */
export function setupShareButton(shareBtn, getShareData) {
    shareBtn.addEventListener('click', () => {
        const { level, status, turn } = getShareData();

        let outcome = status === 'won' ? 'ESCAPED' : 'KILLED';
        let text = `Zombie Escape Online 💀\nLvl ${level} - ${outcome}\nTurn ${turn}\n\n`;
        let gridStr = 'Play: zombie-escape-online.com';

        navigator.clipboard.writeText(text + gridStr).then(() => {
            // Analytics
            trackShare(level);

            const originalText = shareBtn.textContent;
            shareBtn.textContent = "COPIED!";
            setTimeout(() => shareBtn.textContent = originalText, 2000);
        });
    });
}
