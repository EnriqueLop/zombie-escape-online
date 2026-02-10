/**
 * Environment configuration
 * Centralizes environment detection and configuration
 */

export const ENV = {
    // Environment detection
    isLocal: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
    isDevelopment: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
    isProduction: location.hostname !== 'localhost' && location.hostname !== '127.0.0.1',

    // Firebase configuration
    firebase: {
        useEmulators: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
        emulatorPorts: {
            auth: 9099,
            firestore: 8080
        }
    },

    // Feature flags
    features: {
        showCoordinates: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
        enableDebugMode: location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    }
};
