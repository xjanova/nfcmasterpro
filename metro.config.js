const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * Disable package exports resolution to prevent Metro from picking up
 * Node.js-specific entry points (e.g. axios/dist/node/axios.cjs uses crypto)
 */
const config = {
  resolver: {
    unstable_enablePackageExports: false,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
