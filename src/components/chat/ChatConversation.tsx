import React from 'react'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'

interface Message {
    id: string
    type: 'user' | 'ai'
    content: string
    timestamp: string
}

interface ChatConversationProps {
    messages: Message[]
    onSendMessage: (message: string) => void
    chatId: string
}

const ChatConversation = ({ messages, onSendMessage, chatId }: ChatConversationProps) => {
    return (
        <div className='flex flex-row bg-white w-full h-[95vh] rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.1)]'>
            {/* Left Panel - Chat Interface */}
            <div className='w-[50%] border-r border-gray-200 flex flex-col'>
                <div className='flex-1 overflow-hidden pt-2'>
                    <ChatMessages messages={messages} chatId={chatId} />
                </div>
                <div className=' border-gray-200 p-4'>
                    <ChatInput onSendMessage={onSendMessage} />
                </div>
            </div>

            {/* Right Panel - Analytics/Graphics */}
            <div className='w-[50%] p-6 flex flex-col'>
                <div className='bg-gray-50 rounded-lg p-4 h-full flex items-center justify-center'>
                    <div className='text-center text-gray-500'>
                        <div className='mb-4'>
                            <svg className='w-16 h-16 mx-auto text-gray-300' fill='currentColor' viewBox='0 0 20 20'>
                                <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
                            </svg>
                        </div>
                        <h3 className='text-lg font-medium text-gray-600 mb-2'>Analytics Dashboard</h3>
                        <p className='text-sm text-gray-400'>Data visualizations will appear here based on your queries</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatConversation