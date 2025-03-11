// src/app/(auth)/tutors/[id]/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function TutorNotFound() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Tutor Not Found</CardTitle>
                    <CardDescription>
                        The tutor you're looking for doesn't exist or has been removed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        Please check the tutor ID and try again, or return to the tutors list
                        to find the correct tutor.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/tutors">
                            Back to Tutors
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}