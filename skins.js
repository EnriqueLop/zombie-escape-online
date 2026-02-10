/**
 * Zombie Escape Online
 * Skin Definitions - Visual themes that change entity sprites
 */

import { logger } from "./utils/logger.js";

export const SKINS = [
    {
        id: 'neon',
        name: 'NEON',
        class: 'theme-neon',
        description: 'For those who peaked in the 80s and never came back.',
        icons: { player: '🟢', zombie: '🔴', wall: '🟦', exit: '🟡' },
        locked: false
    },
    {
        id: 'forest',
        name: 'FOREST',
        class: 'theme-forest',
        description: 'Touch grass, they said. Now the grass touches back.',
        icons: { player: '🧝', zombie: '🧟', wall: '🌲', exit: '🌸' },
        locked: false
    },
    {
        id: 'indiana',
        name: 'INDIANA',
        class: 'theme-indiana',
        description: 'That belongs in a museum! (You, probably, after this.)',
        icons: { player: '🤠', zombie: '🐍', wall: '🧱', exit: '💎' },
        locked: false
    },
    {
        id: 'kaiju',
        name: 'KAIJU',
        class: 'theme-kaiju',
        description: 'Big lizard energy. Buildings are just crunchy snacks.',
        icons: { player: '🏃', zombie: '🦎', wall: '🏢', exit: '🚁' },
        locked: false
    },
    {
        id: 'pirate',
        name: 'PIRATE',
        class: 'theme-pirate',
        description: 'Arr! The only job where alcoholism is a personality trait.',
        icons: { player: '🏴‍☠️', zombie: '🦑', wall: '🪨', exit: '💰' },
        locked: false
    },
    {
        id: 'jungle',
        name: 'JUNGLE',
        class: 'theme-jungle',
        description: 'Cute bunny vs hungry fox. Nature is brutal and adorable.',
        icons: { player: '🐰', zombie: '🦊', wall: '🌿', exit: '🥕' },
        locked: false
    },
    {
        id: 'space',
        name: 'SPACE',
        class: 'theme-space',
        description: 'In space no one hears you rage quit.',
        icons: { player: '👨‍🚀', zombie: '👾', wall: '🪨', exit: '🚀' },
        locked: false
    },
    {
        id: 'dungeon',
        name: 'DUNGEON',
        class: 'theme-dungeon',
        description: 'Rolled a natural 1 on life choices. Here you are.',
        icons: { player: '⚔️', zombie: '💀', wall: '🧱', exit: '🚪' },
        locked: false
    },
    {
        id: 'arcade',
        name: 'ARCADE',
        class: 'theme-arcade',
        description: 'Wakka wakka. Your parents\' idea of a good time.',
        icons: { player: '😮', zombie: '👻', wall: '🟦', exit: '🍒' },
        locked: false
    },
    {
        id: 'ocean',
        name: 'OCEAN',
        class: 'theme-ocean',
        description: 'Just keep swimming. Mostly away from things with teeth.',
        icons: { player: '🐟', zombie: '🦈', wall: '🪸', exit: '🏝️' },
        locked: false
    },
    {
        id: 'halloween',
        name: 'HALLOWEEN',
        class: 'theme-halloween',
        description: 'The only night adults beg strangers for candy. Unrelated.',
        icons: { player: '🎃', zombie: '👻', wall: '⚰️', exit: '🍬' },
        locked: false
    },
    {
        id: 'winter',
        name: 'WINTER',
        class: 'theme-winter',
        description: 'Global warming made this level shorter. Thanks, oil.',
        icons: { player: '🐧', zombie: '🐻‍❄️', wall: '🧊', exit: '🏠' },
        locked: false
    },
    {
        id: 'pizza',
        name: 'PIZZA',
        class: 'theme-pizza',
        description: 'Pineapple on pizza is the real villain here.',
        icons: { player: '🍕', zombie: '🍍', wall: '🧀', exit: '🍽️' },
        locked: false
    },
    {
        id: 'retro',
        name: 'RETRO',
        class: 'theme-retro',
        description: '4 shades of green. More resolution than your future.',
        icons: { player: '◻️', zombie: '◼️', wall: '▪️', exit: '⬜' },
        locked: false
    },
    {
        id: 'robots',
        name: 'ROBOTS',
        class: 'theme-robots',
        description: 'AI uprising, but make it a puzzle game.',
        icons: { player: '🤖', zombie: '🦾', wall: '⚙️', exit: '🔋' },
        locked: false
    },
    {
        id: 'diet',
        name: 'DIET',
        class: 'theme-diet',
        description: 'Monday starts the diet. Again. Every Monday.',
        icons: { player: '🍔', zombie: '🥗', wall: '🏋️', exit: '🛋️' },
        locked: false
    }
];

export function applySkin(skinId) {
    const skin = SKINS.find(s => s.id === skinId) || SKINS[0];

    // Remove all theme classes
    SKINS.forEach(s => document.body.classList.remove(s.class));

    // Add new theme class
    document.body.classList.add(skin.class);

    logger.debug("Applied skin:", skin.name);
    return skin.id;
}
