import { requireAuth } from '@/lib/session';
import { gatewayClient } from '@/lib/gatewayClient';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
    try {
        await requireAuth();

        const { userId } = params;
        const data = await gatewayClient.regenerateUserToken(userId);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}
