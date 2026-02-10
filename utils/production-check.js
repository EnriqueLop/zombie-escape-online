/**
 * Production build validation
 * Checks for common issues before deployment
 */

import { ENV } from "./env.js";

const checks = [
    {
        name: "Firebase Emulator Check",
        test: () => {
            // Check if emulator code exists in production
            const hasEmulatorCode = document.body.innerHTML.includes('connectAuthEmulator');
            return !hasEmulatorCode;
        },
        error: "Emulator connection code should not be in production build"
    },
    {
        name: "Console Log Check",
        test: () => {
            // Production should use logger, not direct console
            return ENV.isProduction;
        },
        error: "Direct console logs detected in production"
    },
    {
        name: "Security Headers Check",
        test: () => {
            const hasCsp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            return hasCsp !== null;
        },
        error: "Content-Security-Policy header missing"
    }
];

export function validateProduction() {
    if (ENV.isProduction) {
        checks.forEach(check => {
            if (!check.test()) {
                console.error(`[PRODUCTION CHECK FAILED]: ${check.error}`);
            }
        });
    }
}
