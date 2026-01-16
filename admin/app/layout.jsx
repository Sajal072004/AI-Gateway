import './globals.css';

export const metadata = {
    title: 'AI Gateway Admin',
    description: 'Admin dashboard for AI Hybrid Gateway',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
