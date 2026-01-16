import { requireAuth } from '@/lib/session';
import { gatewayClient } from '@/lib/gatewayClient';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    console.log('[API] GET /api/gateway/logs hit');
    try {
        await requireAuth();

        const { searchParams } = new URL(request.url);
        const params = Object.fromEntries(searchParams.entries());

        const data = await gatewayClient.getLogs(params);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}
