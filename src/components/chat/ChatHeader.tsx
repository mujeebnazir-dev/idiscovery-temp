import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MoreHorizontal, Share, Archive } from 'lucide-react'

interface ChatHeaderProps {
    chatId: string
}

const ChatHeader = ({ chatId }: ChatHeaderProps) => {
    return (
        <div className="border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-[#1A365D] text-white text-sm">
                            AI
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            iDiscovery Assistant
                        </h2>
                        <p className="text-sm text-gray-500">Chat ID: {chatId}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                        <Share className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Archive className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default ChatHeader