import { requireAuth } from '@/lib/session';
import { gatewayClient } from '@/lib/gatewayClient';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        await requireAuth();

        const { searchParams } = new URL(request.url);
        const params = Object.fromEntries(searchParams.entries());

        const data = await gatewayClient.getUsage(params);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}
