import React from 'react'
import { ThumbsUp, ThumbsDown, RotateCcw, Clipboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface AiResponseProps {
    content?: string
    timestamp?: string
}

const AiResponse = ({
    content = "The dataset contains 2,128 entries with 43 columns, although many columns are sparsely populated or entirely empty.",
    timestamp
}: AiResponseProps) => {


    return (
        <div className="flex gap-4 mb-6">

            {/* Message Content */}
            <div className="flex-1">
                <Card className="border-[#E5E7EB] border-none shadow-none">
                    <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-gray-800 font-outfit text-[14px] leading-[22px]">
                            {content}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 self-end">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-600 hover:bg-gray-200">
                            <Clipboard className="w-4 h-4 " />
                        </Button>

                        <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-600 hover:bg-gray-200">
                            <ThumbsUp className="w-4 h-4" />
                        </Button>

                        <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-600 hover:bg-gray-200">
                            <ThumbsDown className="w-4 h-4" />
                        </Button>

                        <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-600 hover:bg-gray-200 ml-auto border border-gray-300">
                            <RotateCcw className="w-4 h-4" />
                            Retry
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default AiResponse