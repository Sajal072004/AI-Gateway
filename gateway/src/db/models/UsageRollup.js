import mongoose from 'mongoose';

const usageRollupSchema = new mongoose.Schema({
    periodType: {
        type: String,
        required: true,
        enum: ['day', 'month'],
    },
    period: {
        type: String,
        required: true,
    },
    scope: {
        type: String,
        required: true,
        enum: ['user', 'global'],
    },
    userId: {
        type: String,
        default: null,
    },
    tier: {
        type: String,
        required: true,
        enum: ['cheap', 'premium'],
    },
    requests: {
        type: Number,
        default: 0,
    },
    promptTokens: {
        type: Number,
        default: 0,
    },
    completionTokens: {
        type: Number,
        default: 0,
    },
    totalTokens: {
        type: Number,
        default: 0,
    },
});

// Unique compound index for efficient queries and preventing duplicates
usageRollupSchema.index(
    { periodType: 1, period: 1, scope: 1, userId: 1, tier: 1 },
    { unique: true }
);

export const UsageRollup = mongoose.model('UsageRollup', usageRollupSchema);
