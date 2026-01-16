import mongoose from 'mongoose';
import { config } from '../env.js';
import { SystemPolicy } from './models/SystemPolicy.js';
import { UserPolicy } from './models/UserPolicy.js';

export async function connectDatabase() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');
        await seedData();
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function seedData() {
    console.log('🌱 Checking seed data...');

    // Seed SystemPolicy
    const systemPolicy = await SystemPolicy.findOne({ key: 'system' });
    if (!systemPolicy) {
        await SystemPolicy.create({
            key: 'system',
            globalDailyTokenLimit: {
                cheap: 2000000,
                premium: 500000,
            },
            globalMonthlyTokenLimit: {
                cheap: 60000000,
                premium: 15000000,
            },
            globalDailyRequestLimit: {
                cheap: 5000,
                premium: 2000,
            },
            globalMonthlyRequestLimit: {
                cheap: 150000,
                premium: 60000,
            },
            warningThresholdPct: config.thresholds.warningPct,
            criticalThresholdPct: config.thresholds.criticalPct,
        });
        console.log('  ✓ Created SystemPolicy');
    }

    // Seed UserA (cheap only)
    const userA = await UserPolicy.findOne({ userId: 'userA' });
    if (!userA) {
        const newUser = await UserPolicy.create({
            userId: 'userA',
            token: 'usr_demo_token_userA_replace_in_production',
            allowedTiers: ['cheap'],
            defaultTier: 'cheap',
            dailyTokenLimit: {
                cheap: 200000,
                premium: 0,
            },
            monthlyTokenLimit: {
                cheap: 5000000,
                premium: 0,
            },
            dailyRequestLimit: {
                cheap: 200,
                premium: 0,
            },
            monthlyRequestLimit: {
                cheap: 5000,
                premium: 0,
            },
        });
        console.log(`  ✓ Created UserPolicy for userA (token: ${newUser.token})`);
    }

    // Seed UserB (cheap + premium with small premium budget)
    const userB = await UserPolicy.findOne({ userId: 'userB' });
    if (!userB) {
        const newUser = await UserPolicy.create({
            userId: 'userB',
            token: 'usr_demo_token_userB_replace_in_production',
            allowedTiers: ['cheap', 'premium'],
            defaultTier: 'auto',
            dailyTokenLimit: {
                cheap: 200000,
                premium: 30000,
            },
            monthlyTokenLimit: {
                cheap: 5000000,
                premium: 600000,
            },
            dailyRequestLimit: {
                cheap: 200,
                premium: 30,
            },
            monthlyRequestLimit: {
                cheap: 5000,
                premium: 600,
            },
        });
        console.log(`  ✓ Created UserPolicy for userB (token: ${newUser.token})`);
    }

    // Seed UserC (premium default, large premium budget)
    const userC = await UserPolicy.findOne({ userId: 'userC' });
    if (!userC) {
        const newUser = await UserPolicy.create({
            userId: 'userC',
            token: 'usr_demo_token_userC_replace_in_production',
            allowedTiers: ['cheap', 'premium'],
            defaultTier: 'premium',
            dailyTokenLimit: {
                cheap: 200000,
                premium: 200000,
            },
            monthlyTokenLimit: {
                cheap: 5000000,
                premium: 5000000,
            },
            dailyRequestLimit: {
                cheap: 200,
                premium: 200,
            },
            monthlyRequestLimit: {
                cheap: 5000,
                premium: 5000,
            },
        });
        console.log(`  ✓ Created UserPolicy for userC (token: ${newUser.token})`);
    }

    console.log('✅ Seed data check complete');
}

export async function closeDatabase() {
    await mongoose.connection.close();
    console.log('👋 MongoDB connection closed');
}
