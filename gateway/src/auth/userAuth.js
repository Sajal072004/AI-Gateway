import { UserPolicy } from '../db/models/UserPolicy.js';

/**
 * Fastify hook to authenticate user requests
 * Extracts Bearer token and looks up user in database
 */
export async function authenticateUser(request, reply) {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({
            error: 'unauthorized',
            message: 'Missing or invalid Authorization header. Use: Bearer <token>',
        });
    }

    const token = authHeader.substring(7);

    // Look up user by token in database
    const userPolicy = await UserPolicy.findOne({ token });

    if (!userPolicy) {
        return reply.code(401).send({
            error: 'unauthorized',
            message: 'Invalid user token',
        });
    }

    // Attach userId to request for use in handlers
    request.userId = userPolicy.userId;
}
