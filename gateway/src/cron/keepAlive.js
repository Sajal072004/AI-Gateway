import cron from 'node-cron';

/**
 * Keep-alive cron job to prevent Render free tier from sleeping
 * Pings the /health endpoint every 10 minutes
 */
export function startKeepAliveCron() {
    // Run every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
        try {
            const response = await fetch('https://ai-gateway-zcs0.onrender.com/health');
            const data = await response.json();
            console.log('✅ Keep-alive ping successful:', data);
        } catch (error) {
            console.error('⚠️ Keep-alive ping failed:', error.message);
        }
    });

    console.log('🕐 Keep-alive cron job started (runs every 10 minutes)');
}
