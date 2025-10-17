"use client"
import React, { useState } from 'react'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatHome from '@/components/chat/ChatHome'
import ChatConversation from '@/components/chat/ChatConversation'
import { useMCP } from '@/hooks/useMCP'
import ChatInput from '@/components/chat/ChatInput'

interface Message {
    id: string
    type: 'user' | 'ai'
    content: string
    timestamp: string
    steps?: any[]
    isProcessing?: boolean
}

const ChatPage = ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = React.use(params)
    const [messages, setMessages] = useState<Message[]>([])
    const [isConversationStarted, setIsConversationStarted] = useState(false)
    const { isInitialized, processQuery, isProcessing, error } = useMCP()

    const handleSendMessage = async (message: string) => {
        if (message.trim() && isInitialized) {

            const userMessage: Message = {
                id: Date.now().toString(),
                type: 'user',
                content: message,
                timestamp: new Date().toLocaleTimeString()
            }

            setMessages(prev => [...prev, userMessage])
            setIsConversationStarted(true)

            const processingMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: 'Processing your request...',
                timestamp: new Date().toLocaleTimeString(),
                isProcessing: true,
                steps: []
            }

            setMessages(prev => [...prev, processingMessage])

            try {
                const result = await processQuery(
                    message,
                    (initialResponse) => {
                        setMessages(prev => prev.map(msg =>
                            msg.id === processingMessage.id
                                ? { ...msg, content: initialResponse, isProcessing: true }
                                : msg
                        ))
                    },
                    (stepUpdate) => {
                        setMessages(prev => prev.map(msg =>
                            msg.id === processingMessage.id
                                ? {
                                    ...msg,
                                    steps: [...(msg.steps || []), stepUpdate]
                                }
                                : msg
                        ))
                    }
                )

                setMessages(prev => prev.map(msg =>
                    msg.id === processingMessage.id
                        ? {
                            ...msg,
                            content: result.response?.aiResponse || 'Processing completed',
                            isProcessing: false
                        }
                        : msg
                ))

            } catch (err) {
                setMessages(prev => prev.map(msg =>
                    msg.id === processingMessage.id
                        ? {
                            ...msg,
                            content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
                            isProcessing: false
                        }
                        : msg
                ))
            }
        }
    }

    if (!isInitialized && !error) {
        return (
            <div className="flex h-screen bg-[#FCF7EE] w-full items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A365D] mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing MCP connections...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-screen bg-[#FCF7EE] w-full items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-4">⚠️</div>
                    <p className="text-red-600">MCP Connection Error: {error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-[#1A365D] text-white rounded"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-[#FCF7EE] w-full">
            <ChatSidebar />
            <div className="flex-1 flex flex-col items-center justify-center w-full">
                {!isConversationStarted ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <ChatHome userName='User' />
                        <ChatInput onSendMessage={handleSendMessage} />
                    </div>
                ) : (
                    <ChatConversation
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        chatId={id}
                    />
                )}
            </div>
        </div>
    )
}

export default ChatPage