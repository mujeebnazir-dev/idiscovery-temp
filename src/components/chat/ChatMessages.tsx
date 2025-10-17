import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import UserMessage from './MessageType/UserMessage'
import AiResponse from './MessageType/AiResponse'

interface Message {
    id: string
    type: 'user' | 'ai'
    content: string
    timestamp: string
}

interface ChatMessagesProps {
    messages: Message[]
    chatId: string
}

const ChatMessages = ({ messages, chatId }: ChatMessagesProps) => {
    return (
        <ScrollArea className="h-full w-full">
            <div className="p-6 space-y-4">
                {messages.map((message) => (
                    <div key={message.id} className="w-full">
                        {message.type === 'ai' ? (
                            <AiResponse content={message.content} timestamp={message.timestamp} />
                        ) : (
                            <UserMessage message={message} />
                        )}
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}

export default ChatMessages