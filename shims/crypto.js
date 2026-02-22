// Minimal crypto shim for React Native
// Provides just enough for axios to work without Node.js crypto
module.exports = {
  randomBytes: function(size) {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return Buffer.from ? Buffer.from(bytes) : bytes;
  },
  createHash: function() {
    return {
      update: function() { return this; },
      digest: function(encoding) { return ''; }
    };
  }
};
