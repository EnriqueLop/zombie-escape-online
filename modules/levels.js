/**
 * Level Definitions
 * Loads levels from Firestore database
 */

import { logger } from "../utils/logger.js";

export const TIER_ORDER = ["beginner", "easy", "medium", "hard", "expert"];

/** Flat list of all levels */
let activeLevels = [];

/** Tier-grouped levels: { beginner: [layout, ...], easy: [...], ... } */
let tierGroupedLevels = null;

/**
 * Load levels from Firestore and cache them
 * @param {object} db - Firestore database instance
 * @param {Function} collectionFn - Firestore collection() function
 * @param {Function} getDocsFn - Firestore getDocs() function
 * @returns {Promise<boolean>} true if levels were loaded successfully
 */
export async function loadLevelsFromFirestore(db, collectionFn, getDocsFn) {
    if (!db) {
        logger.warn("No Firestore instance — no levels available");
        return false;
    }

    try {
        const snapshot = await getDocsFn(collectionFn(db, "levels"));

        if (snapshot.empty) {
            logger.warn("No levels in Firestore");
            return false;
        }

        // Group docs by difficulty tier
        const grouped = {};
        for (const tier of TIER_ORDER) {
            grouped[tier] = [];
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const tier = data.difficulty;
            if (grouped[tier]) {
                grouped[tier].push(data);
            }
        });

        // Sort each tier by score ascending, then flatten in tier order
        const sorted = [];
        const tierLayouts = {};
        for (const tier of TIER_ORDER) {
            grouped[tier].sort((a, b) => a.score - b.score);
            tierLayouts[tier] = [];
            for (const level of grouped[tier]) {
                sorted.push(level.layout);
                tierLayouts[tier].push(level.layout);
            }
        }

        if (sorted.length === 0) {
            logger.warn("Firestore levels empty after processing");
            return false;
        }

        activeLevels = sorted;
        tierGroupedLevels = tierLayouts;
        logger.info(`Loaded ${sorted.length} levels from Firestore`);
        return true;
    } catch (e) {
        logger.warn("Failed to load levels from Firestore", e);
        return false;
    }
}

/**
 * Check if levels have been loaded
 * @returns {boolean} True if levels are available
 */
export function hasLevels() {
    return activeLevels.length > 0;
}

/**
 * Get the total number of levels
 * @returns {number} Total level count
 */
export function getLevelCount() {
    return activeLevels.length;
}

/**
 * Get level data at specified index (1-based)
 * @param {number} levelNumber - Level number (1-based)
 * @returns {string[]|null} Level grid data or null if out of bounds
 */
export function getLevel(levelNumber) {
    const index = levelNumber - 1;
    if (index < 0 || index >= activeLevels.length) {
        return null;
    }
    return activeLevels[index];
}

/**
 * Get a random level layout from a specific difficulty tier
 * @param {string} tier - Tier name (beginner, easy, medium, hard, expert)
 * @returns {string[]|null} Random level layout from tier, or null if none available
 */
export function getRandomLevelFromTier(tier) {
    if (!tierGroupedLevels) return null;
    const levels = tierGroupedLevels[tier];
    if (!levels || levels.length === 0) return null;
    const idx = Math.floor(Math.random() * levels.length);
    return levels[idx];
}

/**
 * Get available tiers that have levels
 * @returns {string[]} Tier names that have at least one level
 */
export function getAvailableTiers() {
    if (!tierGroupedLevels) return [];
    return TIER_ORDER.filter(tier => tierGroupedLevels[tier] && tierGroupedLevels[tier].length > 0);
}
