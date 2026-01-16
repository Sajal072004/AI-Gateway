import crypto from 'crypto';

/**
 * Generate a secure random token for user authentication
 * Format: usr_<32 random hex characters>
 */
export function generateUserToken() {
    const randomBytes = crypto.randomBytes(32);
    return `usr_${randomBytes.toString('hex')}`;
}

/**
 * Generate a secure admin token
 * Format: adm_<32 random hex characters>
 */
export function generateAdminToken() {
    const randomBytes = crypto.randomBytes(32);
    return `adm_${randomBytes.toString('hex')}`;
}
