import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { password } = await request.json();

        const adminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN;

        if (password !== adminPassword) {
            return NextResponse.json(
                { error: 'Invalid password' },
                { status: 401 }
            );
        }

        const session = await getSession();
        session.isLoggedIn = true;
        await session.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
