import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MoreVertical } from 'lucide-react'

interface UserProfileProps {
    name?: string
    avatar?: string
    className?: string
}

const UserProfile = ({
    name = "Dr. Gowhar Shafi",
    avatar,
    className = ""
}: UserProfileProps) => {
    return (
        <div className={`w-full h-auto min-h-[40px] flex items-center cursor-pointer justify-between p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors ${className}`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <Avatar className="w-6 h-6 flex-shrink-0">
                    <AvatarImage src={avatar} alt={name} />
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-medium">
                        {name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h3 className="font-outfit font-normal text-sm md:text-base leading-5 text-gray-900 truncate">
                        {name}
                    </h3>
                </div>
            </div>

            <Button variant="ghost" size="icon" className="h-auto p-1 ml-2 flex-shrink-0">
                <MoreVertical className="w-4 h-4 text-gray-500" />
            </Button>
        </div>
    )
}

export default UserProfile