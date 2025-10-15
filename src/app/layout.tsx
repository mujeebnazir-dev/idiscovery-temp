import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "iDiscovery",
    description: "Comprehensive cancer patient data and insights, designed for Decision-making",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="bg-white ">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FCF7EE] rounded-[20px] opacity-100 mx-auto`}
            >
                {children}
            </body>
        </html>
    );
}
