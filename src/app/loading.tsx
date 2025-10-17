import React from 'react'
import Loader from '@/components/Loader'

const Loading = () => {
    return (
        <div className="min-h-screen bg-[#FCF7EE] flex items-center justify-center">
            <Loader
                size="lg"
                variant="spinner"
                text="Loading iDiscovery..."
            />
        </div>
    )
}

export default Loading