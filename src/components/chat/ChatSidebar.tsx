"use client"
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarHeader,
    SidebarSeparator,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    useSidebar
} from '@/components/ui/sidebar';
import { PinIcon, PanelLeftClose, MoveLeft, Plus } from 'lucide-react';
import Logo from '../Logo';
import UserProfile from '../UserProfile';
import cellicon from '../../../public/cellicon.png';
import Image from 'next/image';

const ChatSidebar = () => {
    const { toggleSidebar, state } = useSidebar();

    const chatHistory = [
        { id: '123456', title: 'Cancer Treatment Options', time: '2 hours ago' },
        { id: '789012', title: 'Patient Data Analysis', time: '1 day ago' },
        { id: '345678', title: 'Clinical Trial Information', time: '3 days ago' },
    ]

    return (
        <Sidebar
            className={`${state === 'collapsed' ? 'w-16 min-w-16' : 'w-[20vw] min-w-[240px] max-w-[320px]'} overflow-hidden transition-all duration-300`
            }
            collapsible="icon"
        >
            {/* Header */}
            < SidebarHeader className='flex flex-col p-2' >
                <div className={`flex items-center ${state === 'collapsed' ? 'flex-col space-y-2' : 'flex-row justify-between'}`}>
                    {state === 'collapsed' && (
                        <div className="w-12 h-12 overflow-hidden rounded" >
                            <Image
                                src={cellicon}
                                alt="Cellicon"
                                className='w-16 h-16 object-cover object-center -mt-[6px]'
                            />
                        </div>
                    )}
                    {
                        state === 'expanded' && (
                            <Logo className="w-[132px] h-[39px]" />
                        )
                    }
                    <PanelLeftClose
                        size={state === 'collapsed' ? 24 : 26}
                        className={`cursor-pointer ${state === 'collapsed' ? 'text-gray-600 hover:text-gray-800 my-2' : ''}`}
                        onClick={toggleSidebar}
                    />
                </div>

                {/* Back section */}
                {
                    state === 'expanded' && (
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => { }}>
                                    <div className='flex flex-row items-center text-gray-600 '>
                                        <div className='border rounded p-1 mr-2 cursor-pointer hover:bg-gray-100' onClick={() => { }}>
                                            <MoveLeft size={20} />
                                        </div>
                                        <p className="font-outfit font-medium text-[14px] leading-[20px] tracking-[0%] align-middle">Back</p>
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    )
                }

                {
                    state === 'collapsed' && (
                        <SidebarMenu>
                            <SidebarMenuItem className='flex items-center justify-center'>
                                <SidebarMenuButton
                                    onClick={() => { }}
                                    tooltip="Back"
                                    className="justify-center"
                                >
                                    <div className='border rounded p-1 cursor-pointer hover:bg-gray-100' onClick={() => { }}>
                                        <MoveLeft size={20} />
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    )
                }
            </SidebarHeader>

            {state === 'expanded' && <SidebarSeparator />}

            {/* Content */}
            <SidebarContent className='overflow-hidden' >
                {state === 'expanded' && (
                    <>
                        <SidebarGroup>
                            <SidebarGroupLabel> <h3 className="font-outfit font-medium text-[14px] leading-[16px] tracking-[0.6px] align-middle uppercase text-[#6B7280]">Quick actions</h3></SidebarGroupLabel>
                            < SidebarGroupContent >
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton onClick={() => { }} className='p-0'>
                                            <div className="w-full flex flex-row items-center text-gray-600 boder-2-red-500  p-2">
                                                <div className='flex flex-row items-center text-gray-600 '>
                                                    <div className='border rounded p-1 mr-2 cursor-pointer hover:bg-gray-100' onClick={() => { }}>
                                                        <Plus size={20} />
                                                    </div>

                                                    <p className="font-outfit font-medium text-[14px] leading-[20px] tracking-[0%] align-middle">New Chat</p>
                                                </div>
                                            </div>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        < SidebarSeparator />

                        <SidebarGroup>
                            <SidebarGroupLabel> <h3 className="font-outfit font-medium text-[14px] leading-[16px] tracking-[0.6px] align-middle uppercase text-[#6B7280]">Recents</h3></SidebarGroupLabel>
                            < SidebarGroupContent >

                                <ScrollArea className="h-full">
                                    <div className="w-[224px] h-[160px] top-[263px] left-[8px] opacity-100">
                                        {chatHistory.map((chat) => (
                                            <div key={chat.id} className="w-[224px] h-[32px] opacity-100 rounded-[6px]">
                                                <p className="text-sm font-medium text-[#2E2E2E] truncate cursor-pointer hover:bg-gray-100 p-2">
                                                    {chat.title}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        < SidebarSeparator />

                        <SidebarGroup>
                            <SidebarGroupLabel> <h3 className="font-outfit font-medium text-[14px] leading-[16px] tracking-[0.6px] align-middle uppercase text-[#6B7280]">Pinned</h3></SidebarGroupLabel>
                            < SidebarGroupContent >
                                <div className='rounded-l-[20px] flex flex-col items-center p-2' >
                                    <div className='text-[#B6B5B5]' >
                                        <PinIcon size={44} />
                                    </div>
                                    < h4 className="font-outfit font-normal text-[12px] leading-[16px] tracking-[0px] align-middle capitalize text-black text-center" > No Pinned items Yet </h4>
                                    < p className="font-outfit font-normal text-[12px] leading-[16px] tracking-[0px] text-center align-middle text-[#B6B5B5]" > Pin important discoveries to save them here </p>
                                </div>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}

                {/* Collapsed mode content */}
                {
                    state === 'collapsed' && (
                        <div className="flex flex-col items-center space-y-6 py-4" >
                            <SidebarMenu>
                                {/* New Chat Icon */}
                                < SidebarMenuItem className=' flex items-center justify-center' >
                                    <SidebarMenuButton
                                        onClick={() => { }}
                                        tooltip="New Chat"
                                        className="justify-center"
                                    >
                                        <div className='border p-1 rounded cursor-pointer hover:bg-gray-100' onClick={() => { }}>
                                            <Plus size={20} />
                                        </div>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </div>
                    )
                }
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="p-2" >
                {state === 'expanded' && (
                    <UserProfile name="Dr. Gowhar Shafi" />
                )}
                {
                    state === 'collapsed' && (
                        <SidebarMenu>
                            <SidebarMenuItem className='flex items-center justify-center w-12 h-12 '>
                                <SidebarMenuButton
                                    tooltip="Dr. Gowhar Shafi"
                                    className="justify-center w-full h-full bg-gray-300 rounded-full"
                                >
                                    <span className="text-xl font-medium text-gray-700" > D </span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    )
                }
            </SidebarFooter>
        </Sidebar>
    )
}

export default ChatSidebar