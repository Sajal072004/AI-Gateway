import mongoose from 'mongoose';

const requestLogSchema = new mongoose.Schema({
    ts: {
        type: Date,
        required: true,
        default: Date.now,
    },
    day: {
        type: String,
        required: true,
    },
    month: {
        type: String,
        required: true,
    },
    requestId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    tierRequested: {
        type: String,
        required: true,
    },
    tierUsed: {
        type: String,
        required: true,
    },
    routingReason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['ok', 'error', 'limited'],
    },
    latencyMs: {
        type: Number,
        required: true,
    },
    promptChars: {
        type: Number,
        required: true,
    },
    promptTokens: {
        type: Number,
        required: true,
    },
    completionTokens: {
        type: Number,
        required: true,
    },
    totalTokens: {
        type: Number,
        required: true,
    },
    estimatedTokens: {
        type: Boolean,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    errorMessage: {
        type: String,
        default: null,
    },
});

// Indexes for efficient queries
requestLogSchema.index({ day: 1 });
requestLogSchema.index({ month: 1 });
requestLogSchema.index({ userId: 1 });
requestLogSchema.index({ ts: -1 });
requestLogSchema.index({ tierUsed: 1 });
requestLogSchema.index({ status: 1 });

export const RequestLog = mongoose.model('RequestLog', requestLogSchema);
