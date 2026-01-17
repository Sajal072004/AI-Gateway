import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
    title: 'AI Gateway - Admin Dashboard',
    description: 'Production-grade AI Gateway administration panel',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#1a1a24',
                            color: '#f9fafb',
                            border: '1px solid #3d3d4a',
                        },
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#f9fafb',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#f9fafb',
                            },
                        },
                    }}
                />
            </body>
        </html>
    );
}
