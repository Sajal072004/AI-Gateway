import { config } from '../env.js';

/**
 * Fastify hook to authenticate admin requests
 * Validates admin Bearer token
 */
export async function authenticateAdmin(request, reply) {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(403).send({
            error: 'forbidden',
            message: 'Missing or invalid Authorization header. Use: Bearer <admin_token>',
        });
    }

    const token = authHeader.substring(7);

    if (token !== config.auth.adminToken) {
        return reply.code(403).send({
            error: 'forbidden',
            message: 'Invalid admin token',
        });
    }

    // Mark request as admin-authenticated
    request.isAdmin = true;
}
