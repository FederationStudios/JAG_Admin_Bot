const crypto = require('crypto');
const { staticKey } = require('../config.json').security; // Adjust the path to config.json if needed

function decryptData(encryptedData, iv) {
    if (!encryptedData || !iv) {
        throw new Error('Missing required parameters for decryption');
    }

    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(staticKey, 'hex'); // Use the static key
    const ivBuffer = Buffer.from(iv, 'hex'); // Convert the IV from hex

    const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

function encryptData(data) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(staticKey, 'hex'); // Use the static key
    const iv = crypto.randomBytes(16); // Generate a random IV for each encryption

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return { iv: iv.toString('hex'), encryptedData: encrypted };
}

module.exports = { encryptData, decryptData };
