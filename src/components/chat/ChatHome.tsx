import React from "react";
import Logo from "../Logo";

interface ChatHomeProps {
    userName: string;
}
const ChatHome = ({ userName }: ChatHomeProps) => {

    return (
        <div className="w-[840px] h-[344.75px] opacity-100 gap-[50px] flex flex-col items-center justify-center">
            <Logo className="w-[298px] h-[76px]" />
            <div className="w-[840px] h-[104.75px] opacity-100 gap-[32px] flex flex-col items-center justify-center">
                <h2 className="font-outfit font-bold text-[36px] leading-[12.2px] tracking-[0%] text-center align-middle text-[#1A365D] capitalize">Welcome, {userName}</h2>
                <p className="font-outfit w-[90%] font-normal text-[14px] leading-[22.75px] tracking-[0%] text-center align-middle text-black">I'm your AI research assistant. I can help you discover insights, analyze data,
                    explore complex topics, summarize documents, and much more. What would you like to discover today?</p>
            </div>
        </div>
    )
}

export default ChatHome