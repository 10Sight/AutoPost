import crypto from 'crypto';
import { config } from '../config/env.config.js';

// Ensure ENCRYPTION_KEY is available and valid
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || config.ENCRYPTION_KEY; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.warn("WARNING: ENCRYPTION_KEY is not set or not 32 characters long. Using a fallback for development ONLY. DO NOT USE IN PRODUCTION.");
}

const key = ENCRYPTION_KEY ? Buffer.from(ENCRYPTION_KEY) : crypto.randomBytes(32);

export const encrypt = (text) => {
    if (!text) return text;
    try {
        let iv = crypto.randomBytes(IV_LENGTH);
        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error("Encryption failed:", error);
        return text; // Fallback to storing plain if encryption fails (not ideal but avoids data loss)
    }
};

export const decrypt = (text) => {
    if (!text) return text;
    try {
        let textParts = text.split(':');
        // If not in iv:content format, it might be unencrypted legacy data
        if (textParts.length !== 2) return text;

        let iv = Buffer.from(textParts.shift(), 'hex');
        let encryptedText = Buffer.from(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Decryption failed:", error);
        return text; // Return original if decryption fails (e.g. key mismatch or plain text)
    }
};
