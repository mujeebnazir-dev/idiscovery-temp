"use client"
import Logo from "@/components/Logo"
import { Button } from "@/components/ui/button";
import WelcomeText from "@/components/WelcomeText";
import { ArrowRight } from "lucide-react";
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
            <Button className="bg-[#1A365D] w-[253.5px] h-[51.6px] rounded-[28.17px] flex items-center justify-center shadow-md hover:shadow-xl transition-shadow hover:scale-102 duration-100 hover:bg-[#2c4e7d]" onClick={handleButtonClick}><p className="text-[#FFFFFF] w-[169px] h-[24.6px]">Try iDiscovery</p> <ArrowRight size={24} /></Button>
        </div>
    );
}
