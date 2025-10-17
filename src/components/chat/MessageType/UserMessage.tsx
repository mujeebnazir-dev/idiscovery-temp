import { Card } from '@/components/ui/card'
import React from 'react'

interface Message {
    id: string
    type: 'user' | 'ai'
    content: string
    timestamp: string
}



const UserMessage = ({ message }: { message: Message }) => {
    return (
        <Card className={`p-4  w-full  rounded-[8px] border bg-[#EBEBEB] border-[#E5E7EB]`}>
            <div className="prose prose-sm max-w-none">
                <div className="w-full  font-outfit font-medium text-[14px] leading-[100%] tracking-[0%] align-middle text-[#2E2E2E]">
                    {message.content}
                </div>
            </div>
        </Card>
    )
}

export default UserMessage