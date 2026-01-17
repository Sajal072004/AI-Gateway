import mongoose from 'mongoose';

const userPolicySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    allowedTiers: {
        type: [String],
        required: true,
        enum: ['cheap', 'premium', 'qwen'],
    },
    defaultTier: {
        type: String,
        required: true,
        enum: ['cheap', 'premium', 'qwen', 'auto'],
    },
    dailyTokenLimit: {
        cheap: { type: Number, required: true, default: 0 },
        premium: { type: Number, required: true, default: 0 },
        qwen: { type: Number, required: true, default: 0 },
    },
    monthlyTokenLimit: {
        cheap: { type: Number, required: true, default: 0 },
        premium: { type: Number, required: true, default: 0 },
        qwen: { type: Number, required: true, default: 0 },
    },
    dailyRequestLimit: {
        cheap: { type: Number, required: true, default: 0 },
        premium: { type: Number, required: true, default: 0 },
        qwen: { type: Number, required: true, default: 0 },
    },
    monthlyRequestLimit: {
        cheap: { type: Number, required: true, default: 0 },
        premium: { type: Number, required: true, default: 0 },
        qwen: { type: Number, required: true, default: 0 },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export const UserPolicy = mongoose.model('UserPolicy', userPolicySchema);
