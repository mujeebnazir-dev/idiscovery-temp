"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Paperclip, Mic } from 'lucide-react'

interface ChatInputProps {
    chatId: string
}

const ChatInput = ({ chatId }: ChatInputProps) => {
    const [message, setMessage] = useState('')

    const handleSend = () => {
        if (message.trim()) {
            // Handle send message logic here
            console.log('Sending message:', message)
            setMessage('')
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-end gap-3">
                    <Button variant="ghost" size="sm" className="text-gray-500">
                        <Paperclip className="w-4 h-4" />
                    </Button>

                    <div className="flex-1">
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask about cancer patient data, treatment options, or clinical insights..."
                            className="min-h-[60px] max-h-32 resize-none border-gray-200 focus:border-[#1A365D] focus:ring-[#1A365D]"
                        />
                    </div>

                    <Button variant="ghost" size="sm" className="text-gray-500">
                        <Mic className="w-4 h-4" />
                    </Button>

                    <Button
                        onClick={handleSend}
                        disabled={!message.trim()}
                        className="bg-[#1A365D] hover:bg-[#2D4A6B] text-white"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>

                <div className="mt-2 text-xs text-gray-500 text-center">
                    Press Enter to send, Shift+Enter for new line
                </div>
            </div>
        </div>
    )
}

export default ChatInput