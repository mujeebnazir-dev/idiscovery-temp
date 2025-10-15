import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'

interface ChatMessagesProps {
    chatId: string
}

const ChatMessages = ({ chatId }: ChatMessagesProps) => {
    const messages = [
        {
            id: 1,
            type: 'ai',
            content: 'Hello! I\'m your iDiscovery assistant. I can help you analyze cancer patient data and provide insights for decision-making. How can I assist you today?',
            timestamp: new Date().toLocaleTimeString()
        },
        {
            id: 2,
            type: 'user',
            content: 'Can you help me understand the treatment options for stage 3 breast cancer?',
            timestamp: new Date().toLocaleTimeString()
        },
        {
            id: 3,
            type: 'ai',
            content: 'Certainly! Stage 3 breast cancer treatment typically involves a multimodal approach including:\n\n1. **Neoadjuvant chemotherapy** - Given before surgery to shrink the tumor\n2. **Surgery** - Either mastectomy or breast-conserving surgery\n3. **Adjuvant therapy** - May include additional chemotherapy, radiation, and targeted therapy\n4. **Hormone therapy** - For hormone receptor-positive tumors\n\nThe specific treatment plan depends on factors like tumor characteristics, patient health, and preferences. Would you like me to elaborate on any of these options?',
            timestamp: new Date().toLocaleTimeString()
        }
    ]

    return (
        <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6">
                <div className="space-y-6 max-w-4xl mx-auto">
                    {messages.map((message) => (
                        <div key={message.id} className="flex gap-4">
                            <Avatar className="w-8 h-8 mt-1">
                                <AvatarFallback className={`text-sm ${message.type === 'ai'
                                        ? 'bg-[#1A365D] text-white'
                                        : 'bg-gray-200 text-gray-700'
                                    }`}>
                                    {message.type === 'ai' ? 'AI' : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <Card className="p-4 bg-white">
                                    <div className="prose prose-sm max-w-none">
                                        <div className="whitespace-pre-wrap text-gray-800">
                                            {message.content}
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        {message.timestamp}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}

export default ChatMessages