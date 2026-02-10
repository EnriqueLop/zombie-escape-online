/**
 * Firebase Integration
 * Handles Firebase initialization, authentication, and data persistence
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, connectAuthEmulator }
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, connectFirestoreEmulator }
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { logger } from "../utils/logger.js";
import { ENV } from "../utils/env.js";

// Firebase instances
let app, auth, db, currentUser = null;

/**
 * Initialize Firebase with emulator detection
 * @returns {Promise<void>}
 */
export async function initFirebase() {
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
    } catch (e) {
        logger.warn("Firebase initialization skipped", e);
    }
}

/**
 * Set up authentication state listener
 * @param {Function} onAuthChange - Callback(user) when auth state changes
 */
export function setupAuth(onAuthChange) {
    if (!auth) return;

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        onAuthChange(user);
    });
}

/**
 * Sign in with Google OAuth
 * @returns {Promise<void>}
 */
export async function loginWithGoogle() {
    if (!auth) {
        logger.error("Firebase not initialized");
        return;
    }

    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    } catch (e) {
        logger.error("Login failed", e);
        throw e;
    }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function logout() {
    if (!auth) return;
    await signOut(auth);
}

/**
 * Get current authenticated user
 * @returns {object|null} Current user or null
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Save user progress to Firestore
 * @param {string} userId - User ID
 * @param {number} level - Level reached
 * @param {string} displayName - User display name
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export async function saveProgress(userId, level, displayName, email) {
    if (!db) {
        logger.warn("Firestore not initialized, cannot save progress");
        return;
    }

    try {
        const userRef = doc(db, 'users', userId);

        // Check current saved level to avoid overwriting high score
        const snap = await getDoc(userRef);
        let currentMax = 0;
        if (snap.exists()) {
            currentMax = snap.data().level || 0;
        }

        if (level > currentMax) {
            await setDoc(userRef, {
                level: level,
                lastPlayed: new Date(),
                email: email,
                name: displayName || 'Anonymous'
            }, { merge: true });
            logger.info("Progress saved", level);
        }
    } catch (e) {
        logger.error("Error saving progress", e);
    }
}

/**
 * Load user progress from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} User data or null
 */
export async function loadProgress(userId) {
    if (!db) {
        logger.warn("Firestore not initialized, cannot load progress");
        return null;
    }

    try {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            logger.info("Progress loaded", snap.data().level);
            return snap.data();
        }
        return null;
    } catch (e) {
        logger.error("Error loading progress", e);
        return null;
    }
}

/**
 * Save user skin preference
 * @param {string} userId - User ID
 * @param {string} skinId - Skin ID to save
 * @returns {Promise<void>}
 */
/**
 * Get Firestore database instance
 * @returns {object|null} Firestore db instance or null
 */
export function getDb() {
    return db;
}

/**
 * Re-export Firestore query helpers for use by other modules
 */
export { collection, getDocs };

/**
 * Save user skin preference
 * @param {string} userId - User ID
 * @param {string} skinId - Skin ID to save
 * @returns {Promise<void>}
 */
export async function saveSkinPreference(userId, skinId) {
    if (!db) return;

    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            skin: skinId
        }, { merge: true });
    } catch (e) {
        logger.error("Error saving skin preference", e);
    }
}
