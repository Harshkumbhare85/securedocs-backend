const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

// 🔐 Encrypt buffer
function encryptBuffer(buffer, key, iv) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return encrypted;
}

// 🔓 Decrypt buffer
function decryptBuffer(encryptedBuffer, key, iv) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted;
}

// Export all
module.exports = {
  encryptBuffer,
  decryptBuffer, // ✅ now added
  generateKeyIV: () => ({
    key: crypto.randomBytes(32),
    iv: crypto.randomBytes(16)
  })
};
