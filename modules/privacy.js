/**
 * Privacy & Cookie Consent Module
 * Handles cookie consent and privacy notices
 */

import { logger } from "../utils/logger.js";

const CONSENT_KEY = 'zeo_cookie_consent';
const CONSENT_VERSION = '1.0';

/**
 * Check if user has given consent
 * @returns {boolean} Whether consent has been given
 */
export function hasConsent() {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) return false;

    try {
        const data = JSON.parse(consent);
        return data.version === CONSENT_VERSION && data.accepted === true;
    } catch (e) {
        return false;
    }
}

/**
 * Save user consent
 * @param {boolean} accepted - Whether user accepted
 */
export function saveConsent(accepted) {
    const data = {
        accepted: accepted,
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    logger.debug("Cookie consent saved:", accepted);
}

/**
 * Show cookie consent banner
 */
export function showCookieConsent() {
    // Check if already shown
    if (hasConsent()) {
        logger.debug("Cookie consent already given");
        return;
    }

    const banner = document.getElementById('cookie-consent-banner');
    if (!banner) {
        logger.warn("Cookie consent banner not found");
        return;
    }

    // Show banner after short delay
    setTimeout(() => {
        banner.classList.remove('hidden');
        banner.setAttribute('aria-hidden', 'false');

        // Focus on the banner for accessibility
        const acceptBtn = banner.querySelector('#cookie-accept-btn');
        if (acceptBtn) {
            acceptBtn.focus();
        }
    }, 1000);
}

/**
 * Hide cookie consent banner
 */
export function hideCookieConsent() {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
        banner.classList.add('hidden');
        banner.setAttribute('aria-hidden', 'true');
    }
}

/**
 * Initialize cookie consent
 */
export function initCookieConsent() {
    const banner = document.getElementById('cookie-consent-banner');
    if (!banner) {
        logger.warn("Cookie consent banner not found in DOM");
        return;
    }

    // Accept button
    const acceptBtn = document.getElementById('cookie-accept-btn');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            saveConsent(true);
            hideCookieConsent();
        });
    }

    // Decline button
    const declineBtn = document.getElementById('cookie-decline-btn');
    if (declineBtn) {
        declineBtn.addEventListener('click', () => {
            saveConsent(false);
            hideCookieConsent();
            // Optionally disable analytics
            disableAnalytics();
        });
    }

    // Settings button
    const settingsBtn = document.getElementById('cookie-settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            showPrivacyPolicy();
        });
    }

    // Show banner if no consent yet
    if (!hasConsent()) {
        showCookieConsent();
    }

    logger.debug("Cookie consent initialized");
}

/**
 * Disable analytics if user declines
 */
function disableAnalytics() {
    // Disable Google Analytics
    window['ga-disable-G-0RWV84PCEW'] = true;
    logger.debug("Analytics disabled");
}

/**
 * Show privacy policy modal
 */
export function showPrivacyPolicy() {
    const modal = document.getElementById('privacy-policy-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');

        // Focus first button
        const closeBtn = modal.querySelector('#privacy-close-btn');
        if (closeBtn) {
            closeBtn.focus();
        }
    }
}

/**
 * Hide privacy policy modal
 */
export function hidePrivacyPolicy() {
    const modal = document.getElementById('privacy-policy-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }
}

/**
 * Initialize privacy policy modal
 */
export function initPrivacyPolicy() {
    const modal = document.getElementById('privacy-policy-modal');
    if (!modal) return;

    // Close button
    const closeBtn = document.getElementById('privacy-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hidePrivacyPolicy);
    }

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hidePrivacyPolicy();
        }
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            hidePrivacyPolicy();
        }
    });

    logger.debug("Privacy policy modal initialized");
}

/**
 * Initialize all privacy features
 */
export function initPrivacy() {
    initCookieConsent();
    initPrivacyPolicy();
}
