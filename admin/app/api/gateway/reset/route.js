import { requireAuth } from '@/lib/session';
import { gatewayClient } from '@/lib/gatewayClient';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        await requireAuth();

        const body = await request.json();
        const data = await gatewayClient.resetUsage(body);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}
