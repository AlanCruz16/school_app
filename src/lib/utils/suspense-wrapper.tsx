// src/lib/utils/suspense-wrapper.tsx
'use client'

import { useEffect, useState } from 'react'

/**
 * This client component helps ensure skeletons are properly displayed 
 * by delaying the transition to the actual content.
 * 
 * Use this to wrap any component that should show a skeleton while loading.
 */
export function SuspenseWrapper({
    children,
    minimumLoadingTime = 500 // Minimum time to show skeleton (ms)
}: {
    children: React.ReactNode
    minimumLoadingTime?: number
}) {
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, minimumLoadingTime)

        return () => clearTimeout(timer)
    }, [minimumLoadingTime])

    // During the loading period, don't render anything
    // This forces the fallback to remain visible
    if (isLoading) {
        return null
    }

    return children
}