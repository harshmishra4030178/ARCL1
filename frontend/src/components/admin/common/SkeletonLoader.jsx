import React from 'react'

const SkeletonLoader = () => {
  return (
    <>
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 border-b border-gray-100 animate-pulse"
          >
            {/* Left side (text placeholders) */}
            <div className="space-y-2 w-2/3">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>

            {/* Right side (icons placeholders) */}
            <div className="flex gap-3">
                <div className="h-5 w-5 bg-gray-300 rounded"></div>
                <div className="h-5 w-5 bg-gray-300 rounded"></div>
            </div>
        </div> 
        ))}
    </>
  )
}

export default SkeletonLoader