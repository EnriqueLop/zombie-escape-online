(function (exports) {

    // --- Configuration ---
    const CONFIG = {
        gridSize: 10, // Default, can be overridden
        zombieMoveSpeed: 2,
    };

    class GameEngine {
        constructor(width, height) {
            this.width = width || CONFIG.gridSize;
            this.height = height || CONFIG.gridSize;
            this.state = this.getInitialState();
        }

        getInitialState() {
            return {
                turn: 0,
                player: { x: 0, y: 0 },
                exit: { x: 0, y: 0 },
                zombies: [],
                walls: [],
                isGameOver: false,
                status: 'playing', // playing, lost, won
            };
        }

        loadLevel(layout) {
            this.height = layout.length;
            this.width = layout[0].length;
            this.state = this.getInitialState();

            let zombieIdCounter = 0;

            for (let y = 0; y < this.height; y++) {
                const row = layout[y];
                for (let x = 0; x < this.width; x++) {
                    const char = row[x];
                    switch (char) {
                        case 'P': this.state.player = { x, y }; break;
                        case 'Z': this.state.zombies.push({ x, y, id: zombieIdCounter++ }); break;
                        case '#': this.state.walls.push({ x, y }); break;
                        case 'E': this.state.exit = { x, y }; break;
                    }
                }
            }
        }

        // Returns { moved: boolean, status: 'playing'|'lost'|'won' }
        movePlayer(dx, dy) {
            if (this.state.isGameOver) return { moved: false, status: this.state.status };

            const newX = this.state.player.x + dx;
            const newY = this.state.player.y + dy;

            if (!this.isValidMove(newX, newY)) return { moved: false, status: this.state.status };

            // Move
            this.state.player.x = newX;
            this.state.player.y = newY;
            this.state.turn++;

            // Check Instant Death (Walking into zombie)
            if (this.isZombieAt(newX, newY)) {
                return this.gameOver(false);
            }

            // Check Win
            if (this.state.player.x === this.state.exit.x && this.state.player.y === this.state.exit.y) {
                return this.gameOver(true);
            }

            // Zombies Move
            const trapEvents = this.processZombieTurn();

            // Check Loss after zombies move
            if (this.checkLoss()) {
                return this.gameOver(false);
            }

            return { moved: true, status: this.state.status, trapEvents };
        }

        processZombieTurn() {
            let totalTraps = 0;
            for (let step = 0; step < CONFIG.zombieMoveSpeed; step++) {
                if (this.state.isGameOver) break;
                totalTraps += this.moveZombiesSingleStep();
                if (this.checkLoss()) {
                    this.gameOver(false);
                    break;
                }
            }
            return totalTraps;
        }

        // Returns number of zombies that WANTED to move but were blocked (Trapped)
        moveZombiesSingleStep() {
            let traps = 0;
            this.state.zombies.forEach(z => {
                const dx = this.state.player.x - z.x;
                const dy = this.state.player.y - z.y;

                // Dumb AI: strictly minimize distance.
                // 1. Try max axis.
                // 2. If blocked, try min axis (if non-zero).
                // 3. Else wait.

                let primaryMove = { x: 0, y: 0 };
                let secondaryMove = { x: 0, y: 0 };

                if (Math.abs(dx) > Math.abs(dy)) {
                    primaryMove = { x: Math.sign(dx), y: 0 };
                    if (dy !== 0) secondaryMove = { x: 0, y: Math.sign(dy) };
                } else {
                    primaryMove = { x: 0, y: Math.sign(dy) };
                    if (dx !== 0) secondaryMove = { x: Math.sign(dx), y: 0 };
                }

                if (this.tryMoveZombie(z, primaryMove)) {
                    // Moved primary
                } else {
                    // Access denied on primary
                    if (secondaryMove.x !== 0 || secondaryMove.y !== 0) {
                        if (this.tryMoveZombie(z, secondaryMove)) {
                            // Moved secondary
                            // Is this a "trap"? Not really, it's just pathing.
                        } else {
                            // Blocked on secondary too.
                            traps++;
                        }
                    } else {
                        // No secondary move available (aligned on one axis), and blocked on primary.
                        traps++;
                    }
                }
            });
            return traps;
        }

        tryMoveZombie(z, move) {
            let targetX = z.x + move.x;
            let targetY = z.y + move.y;

            if (this.canZombieMoveTo(targetX, targetY, z.id)) {
                z.x = targetX;
                z.y = targetY;
                return true;
            }
            return false;
        }

        canZombieMoveTo(x, y, myId) {
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
            // Blocked by Walls
            if (this.isWall(x, y)) return false;
            // Blocked by Other Zombies
            if (this.isZombieAt(x, y, myId)) return false;
            // NOTE: Zombies CAN move onto the player (that's how they kill).
            // But they cannot move onto the Exit? Assuming yes, they can walk on exit.
            return true;
        }

        isValidMove(x, y) {
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
            if (this.isWall(x, y)) return false;
            return true; // Can move into zombie (and die)
        }

        isWall(x, y) {
            return this.state.walls.some(w => w.x === x && w.y === y);
        }

        isZombieAt(x, y, excludeId) {
            return this.state.zombies.some(z => z.x === x && z.y === y && z.id !== excludeId);
        }

        checkLoss() {
            return this.state.zombies.some(z => z.x === this.state.player.x && z.y === this.state.player.y);
        }

        gameOver(win) {
            this.state.isGameOver = true;
            this.state.status = win ? 'won' : 'lost';
            return { moved: true, status: this.state.status };
        }

        // Utils for Generator
        cloneState() {
            return JSON.parse(JSON.stringify(this.state));
        }

        serialize() {
            // Convert current state to ASCII representation
            let rows = [];
            for (let y = 0; y < this.height; y++) {
                let row = "";
                for (let x = 0; x < this.width; x++) {
                    if (this.state.player.x === x && this.state.player.y === y) row += "P";
                    else if (this.state.zombies.some(z => z.x === x && z.y === y)) row += "Z";
                    else if (this.state.walls.some(w => w.x === x && w.y === y)) row += "#";
                    else if (this.state.exit.x === x && this.state.exit.y === y) row += "E";
                    else row += ".";
                }
                rows.push(row);
            }
            return rows;
        }
    }

    exports.GameEngine = GameEngine;
    exports.CONFIG = CONFIG;

})(typeof exports === 'undefined' ? (typeof window === 'undefined' ? this : window) : exports);
