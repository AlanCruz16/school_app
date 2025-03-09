// src/app/error/page.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function ErrorPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-red-600">Authentication Error</CardTitle>
                    <CardDescription>
                        There was a problem with your login attempt
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p>
                            Your login attempt failed. This could be due to:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Incorrect email or password</li>
                            <li>Your account may be deactivated</li>
                            <li>You don't have permission to access this system</li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/login">
                            Try Again
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}