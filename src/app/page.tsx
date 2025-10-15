"use client"
import Logo from "@/components/Logo"
import { Button } from "@/components/ui/button";
import WelcomeText from "@/components/WelcomeText";
import { useRouter } from "next/navigation";


export default function Home() {
    const router = useRouter();

    const handleButtonClick = () => {
        const randomId = `${Math.floor(100000 + Math.random() * 900000)}`;
        router.push(`/chat/${randomId}`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2 gap-12">
            <Logo className="w-[365px] h-[88px]" />
            <WelcomeText />
            <Button className="bg-[#1A365D] w-[253.5px] h-[51.6px] rounded-[28.17px] flex items-center justify-center drop-shadow-[0px_12.91px_51.65px_rgba(26,54,93,0.24)]" onClick={handleButtonClick}><span className="text-[#FFFFFF] w-[169px] h-[24.6px]">Try iDiscovery Icon</span></Button>
        </div>
    );
}
