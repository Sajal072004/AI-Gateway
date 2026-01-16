import { requireAuth } from '@/lib/session';
import { gatewayClient } from '@/lib/gatewayClient';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await requireAuth();

        const data = await gatewayClient.getUsers();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

export async function PUT(request) {
    try {
        await requireAuth();

        const body = await request.json();
        const { userId, ...updates } = body;

        const data = await gatewayClient.updateUser(userId, updates);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

export async function POST(request) {
    try {
        await requireAuth();

        const body = await request.json();
        const data = await gatewayClient.createUser(body);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        await requireAuth();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const deleteUsageData = searchParams.get('deleteUsageData');

        const data = await gatewayClient.deleteUser(userId, deleteUsageData);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}
