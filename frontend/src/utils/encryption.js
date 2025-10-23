import CryptoJS from 'crypto-js';
// import process from "../../.eslintrc.cjs";
// import process from "../../.eslintrc.cjs";

const SECRET_KEY = 'supersecretkey123';

export const encryptComment = (text) => {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decryptComment = (cipherText) => {
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Failed to decrypt comment:', error);
        return '[Unable to decrypt]';
    }
};
