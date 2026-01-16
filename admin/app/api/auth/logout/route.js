import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const session = await getSession();
        session.destroy();

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
