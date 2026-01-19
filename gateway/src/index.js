import Fastify from 'fastify';
import { config } from './env.js';
import { connectDatabase, closeDatabase } from './db/mongo.js';
import { registerChatRoutes } from './routes/chat.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerOpenAIRoutes } from './routes/openai.js';
import { startKeepAliveCron } from './cron/keepAlive.js';

const fastify = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
});

// Connect to database
await connectDatabase();

// Register routes
await registerChatRoutes(fastify);
await registerAdminRoutes(fastify);
await registerOpenAIRoutes(fastify);

// Health check
fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 Gateway server running on http://localhost:${config.port}`);

    // Start keep-alive cron job to prevent Render free tier from sleeping
    startKeepAliveCron();
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
}

// Graceful shutdown
const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await fastify.close();
    await closeDatabase();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
