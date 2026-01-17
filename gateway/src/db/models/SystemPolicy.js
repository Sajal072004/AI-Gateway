import mongoose from 'mongoose';

const systemPolicySchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'system',
    },
    globalDailyTokenLimit: {
        cheap: { type: Number, required: true, default: 0 },
        premium: { type: Number, required: true, default: 0 },
        qwen: { type: Number, required: true, default: 0 },
    },
    globalMonthlyTokenLimit: {
        cheap: { type: Number, required: true, default: 0 },
        premium: { type: Number, required: true, default: 0 },
        qwen: { type: Number, required: true, default: 0 },
    },
    globalDailyRequestLimit: {
        cheap: { type: Number, required: true, default: 0 },
        premium: { type: Number, required: true, default: 0 },
        qwen: { type: Number, required: true, default: 0 },
    },
    globalMonthlyRequestLimit: {
        cheap: { type: Number, required: true, default: 0 },
        premium: { type: Number, required: true, default: 0 },
        qwen: { type: Number, required: true, default: 0 },
    },
    warningThresholdPct: {
        type: Number,
        required: true,
        default: 80,
    },
    criticalThresholdPct: {
        type: Number,
        required: true,
        default: 95,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export const SystemPolicy = mongoose.model('SystemPolicy', systemPolicySchema);
