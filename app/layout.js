import { Maven_Pro } from "next/font/google";
import "./globals.css";
const maven = Maven_Pro({ subsets: ["latin"] });

export const metadata = {
    title: "Schedule a Call - FLATED",
    description: "Schedule a call with the FLATED team.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={maven.className}>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <main style={{ flex: 1 }}>
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
