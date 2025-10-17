import React from 'react'

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg'
    variant?: 'spinner' | 'pulse' | 'dots'
    text?: string
}

const Loader = ({
    size = 'md',
    variant = 'spinner',
    text = 'Loading...'
}: LoaderProps) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    }

    const renderSpinner = () => (
        <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-[#1A365D] rounded-full animate-spin`}></div>
    )

    const renderPulse = () => (
        <div className={`${sizeClasses[size]} bg-[#1A365D] rounded-full animate-pulse`}></div>
    )

    const renderDots = () => (
        <div className="flex gap-2">
            <div className="w-3 h-3 bg-[#1A365D] rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-[#1A365D] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-[#1A365D] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
    )

    const renderLoader = () => {
        switch (variant) {
            case 'pulse': return renderPulse()
            case 'dots': return renderDots()
            default: return renderSpinner()
        }
    }

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            {renderLoader()}
            <p className="font-outfit font-normal text-[14px] leading-[18px] text-gray-600">
                {text}
            </p>
        </div>
    )
}

export default Loader