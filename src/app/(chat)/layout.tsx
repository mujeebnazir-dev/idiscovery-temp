import { SidebarProvider } from "@/components/ui/sidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "iDiscovery Chat",
    description: "Chat interface for cancer patient data insights",
};

export default function ChatLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-[#FCF7EE]">
            <SidebarProvider>
                <div className="w-full max-w-[1440px] mx-auto">
                    {children}
                </div>
            </SidebarProvider>
        </div>
    );
}