const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); // Store this securely
const iv = crypto.randomBytes(16);

function encryptData(data) {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

function decryptData(encryptedData, iv) {
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(Buffer.from(encryptedData, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// Example usage
const dataToEncrypt = "suman9725";
const encrypted = encryptData(dataToEncrypt);
console.log(encrypted.iv)
console.log(encrypted.encryptedData)
// Store `encrypted.encryptedData` and `encrypted.iv` in the database

// When retrieving
const decryptedData = decryptData(encrypted.encryptedData, encrypted.iv);

console.log(decryptedData); // Output will be 'sensitiveData'
