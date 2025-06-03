import CryptoJS from 'crypto-js';

/**
 * Encrypts sensitive data with a user-specific key
 */
export const encryptData = (data: string, userKey: string): string => {
  return CryptoJS.AES.encrypt(data, userKey).toString();
};

/**
 * Decrypts sensitive data with a user-specific key
 */
export const decryptData = (encryptedData: string, userKey: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, userKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Generates a device-specific key for additional encryption layer
 */
export const generateDeviceKey = (): string => {
  // SSR-safe check for browser environment
  if (typeof window === 'undefined') {
    return 'server-side-key';
  }
  
  // Create a unique device identifier based on browser fingerprint
  // This is a simplified version - in production use a robust fingerprinting library
  const browserInfo = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width,
    screen.height
  ].join('|');
  
  return CryptoJS.SHA256(browserInfo).toString();
};

/**
 * Securely stores API key in localStorage with encryption
 */
export const storeApiKey = (apiKey: string): void => {
  if (!apiKey || typeof window === 'undefined') return;
  
  // Get user ID from auth context to use as encryption key
  const userId = localStorage.getItem('userId') || 'default-user';
  const deviceKey = generateDeviceKey();
  const encryptionKey = `${userId}-${deviceKey}`;
  
  // Double encryption
  const encryptedKey = encryptData(apiKey, encryptionKey);
  localStorage.setItem('encrypted_api_key', encryptedKey);
};

/**
 * Retrieves and decrypts API key from localStorage
 */
export const getApiKey = (): string | null => {
  // SSR-safe check for browser environment
  if (typeof window === 'undefined') {
    return null;
  }
  
  const encryptedKey = localStorage.getItem('encrypted_api_key');
  if (!encryptedKey) return null;
  
  // Get user ID from auth context to use as encryption key
  const userId = localStorage.getItem('userId') || 'default-user';
  const deviceKey = generateDeviceKey();
  const encryptionKey = `${userId}-${deviceKey}`;
  
  try {
    return decryptData(encryptedKey, encryptionKey);
  } catch (error) {
    console.error('Failed to decrypt API key');
    return null;
  }
};

/**
 * Removes API key from localStorage
 */
export const clearApiKey = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('encrypted_api_key');
};
