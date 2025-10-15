import React from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarTrigger } from '@/components/ui/sidebar'
import { PlusCircle, MessageCircle, Settings, LogOut, Menu, ArrowLeftSquare } from 'lucide-react'
import Logo from '../Logo'

const ChatSidebar = () => {
    const chatHistory = [
        { id: '123456', title: 'Cancer Treatment Options', time: '2 hours ago' },
        { id: '789012', title: 'Patient Data Analysis', time: '1 day ago' },
        { id: '345678', title: 'Clinical Trial Information', time: '3 days ago' },
    ]

    return (
        <Sidebar className='w-[240px]'>
            {/* Header */}
            <SidebarHeader className='flex flex-col'>
                <div className='flex flex-row'>
                    <Logo className="w-[132px] h-[39px]" />
                    <SidebarTrigger>
                        <Button variant="ghost" size="lg" className="p-1">
                            <Menu className="w-12 h-12" />
                        </Button>
                    </SidebarTrigger>
                </div>
                <div className="w-full mt-4 justify-start text-gray-600">
                    <ArrowLeftSquare className="w-4 h-4 mr-2" />
                    <p>Back</p>
                </div>


            </SidebarHeader>

            <Separator />

            {/* Chat History */}
            <SidebarContent>
                <div className="flex-1 p-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Recent Chats</h3>
                    <ScrollArea className="h-full">
                        <div className="space-y-2">
                            {chatHistory.map((chat) => (
                                <div
                                    key={chat.id}
                                    className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100"
                                >
                                    <div className="flex items-start gap-3">
                                        <MessageCircle className="w-4 h-4 text-[#1A365D] mt-1" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {chat.title}
                                            </p>
                                            <p className="text-xs text-gray-500">{chat.time}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </SidebarContent>



            <Separator />

            {/* Bottom Actions */}
            <SidebarFooter>
                <div className="p-4 space-y-2">
                    <Button variant="ghost" className="w-full justify-start text-gray-600">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </SidebarFooter>

        </Sidebar>
    )
}

export default ChatSidebar