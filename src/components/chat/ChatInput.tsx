// filepath: c:\Users\Mujeeb Nazir\Desktop\onecell\idiscovery-temp\src\components\chat\ChatInput.tsx
"use client";
import React, { useState } from 'react';
import { Plus, Mic, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
    onSendMessage: (message: string) => void
}

const ChatInput = ({ onSendMessage }: ChatInputProps) => {
    const [message, setMessage] = useState('');

    const handleSubmit = () => {
        if (message.trim()) {
            onSendMessage(message)
            setMessage('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="w-full">
            <div className="w-full h-[64px] opacity-100 rounded-[12px] border bg-white shadow-lg p-2 flex items-center gap-2">
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything you'd like to discover..."
                    className="border-none w-full resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-gray-400 bg-transparent flex items-center h-[48px] py-3"
                    rows={1}
                    style={{
                        lineHeight: '48px',
                        paddingTop: '12px',
                        paddingBottom: '12px',
                        scrollBehavior: 'smooth',
                        scrollbarColor: 'transparent',
                        scrollbarWidth: 'none'
                    }}
                />

                {/* <div className='rounded p-2 cursor-pointer hover:bg-gray-100' onClick={() => { }}>
                    <Plus size={20} color='#71717A' />
                </div>

                <div className='rounded p-2 cursor-pointer hover:bg-gray-100' onClick={() => { }}>
                    <Mic size={20} color='#71717A' />
                </div> */}

                <div className='rounded p-2 mr-2 cursor-pointer bg-[#1A365D] hover:bg-[#294367] shadow-md hover:transition hover:shadow-xl' onClick={handleSubmit}>
                    <Send size={20} color='white' />
                </div>
            </div>
        </div>
    );
}

export default ChatInput;