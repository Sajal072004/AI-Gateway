/**
 * Generate a unique request ID
 */
export function generateRequestId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `req_${timestamp}_${random}`;
}
