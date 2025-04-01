'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, X } from 'lucide-react'
import { debounce } from 'lodash'

export default function TutorSearch() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Only initialize from URL params, don't continuously sync
    const [query, setQuery] = useState(searchParams.get('query') || '')

    // Create a debounced search function
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            // Create a new URLSearchParams object
            const params = new URLSearchParams(searchParams.toString())
            if (value) {
                params.set('query', value)
            } else {
                params.delete('query')
            }

            router.push(`${pathname}?${params.toString()}`)
        }, 300),
        [pathname, router, searchParams]
    )

    // Reset search
    const resetSearch = () => {
        setQuery('')
        router.push(pathname)
    }

    // Clean up debounced function on unmount
    useEffect(() => {
        return () => {
            debouncedSearch.cancel()
        }
    }, [debouncedSearch])

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar tutores por nombre, correo o teléfono..."
                            className="pl-8"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                debouncedSearch(e.target.value)
                            }}
                        />
                    </div>

                    {query && (
                        <Button
                            variant="outline"
                            onClick={resetSearch}
                            className="flex gap-2"
                        >
                            <X className="h-4 w-4" />
                            Limpiar
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
