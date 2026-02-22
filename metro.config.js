const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration for NFCMasterPro
 * - Provides crypto shim for axios (uses Node.js crypto in its CJS bundle)
 * - Disables package exports to prevent Metro from picking up Node.js-specific entry points
 */
const config = {
  resolver: {
    extraNodeModules: {
      crypto: path.resolve(__dirname, 'shims/crypto.js'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
