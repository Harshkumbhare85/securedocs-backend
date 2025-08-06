// utils/encryption.js
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

function encryptBuffer(buffer, key, iv) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  return Buffer.concat([cipher.update(buffer), cipher.final()]);
}

function decryptBuffer(buffer, key, iv) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  return Buffer.concat([decipher.update(buffer), decipher.final()]);
}

function generateKeyIV() {
  return {
    key: crypto.randomBytes(32),
    iv: crypto.randomBytes(16),
  };
}

module.exports = {
  encryptBuffer,
  decryptBuffer,
  generateKeyIV,
};
