import { requireAuth } from '@/lib/session';
import { gatewayClient } from '@/lib/gatewayClient';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
    try {
        await requireAuth();

        // In Next.js 15, params must be awaited
        const { userId } = await params;
        console.log(`[AdminAPI] Regenerating token for user: ${userId}`);

        const data = await gatewayClient.regenerateUserToken(userId);
        console.log(`[AdminAPI] Token regeneration response:`, data);

        return NextResponse.json(data);
    } catch (error) {
        console.error(`[AdminAPI] Token regeneration error:`, error);
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}
