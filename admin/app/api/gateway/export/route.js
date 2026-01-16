import { requireAuth } from '@/lib/session';
import { gatewayClient } from '@/lib/gatewayClient';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        await requireAuth();

        const { searchParams } = new URL(request.url);
        const params = Object.fromEntries(searchParams.entries());

        const data = await gatewayClient.exportData(params);

        // If CSV, return as text with appropriate headers
        if (params.format === 'csv') {
            return new NextResponse(data, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="export.csv"`,
                },
            });
        }

        // JSON export
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}
