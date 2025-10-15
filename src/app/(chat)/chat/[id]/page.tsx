import React from 'react'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatHome from '@/components/chat/ChatHome'
import ChatInput from '@/components/chat/ChatInput'

const ChatPage = ({ params }: { params: { id: string } }) => {
    return (
        <div className="flex h-screen bg-[#FCF7EE]">
            {/* Sidebar */}
            <ChatSidebar />

            {/* Main Chat Area */}
            {/* <div className="flex-1 flex flex-col">
                <ChatHome />
                <ChatInput chatId={params.id} />
            </div> */}
        </div>
    )
}

export default ChatPage