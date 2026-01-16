import './globals.css';

export const metadata = {
    title: 'AI Gateway Admin',
    description: 'Admin dashboard for AI Hybrid Gateway',
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                {children}
                <Toaster position="top-center" />
            </body>
        </html>
    );
}
