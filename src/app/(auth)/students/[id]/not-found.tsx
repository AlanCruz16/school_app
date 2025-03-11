// src/app/(auth)/students/[id]/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function StudentNotFound() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Student Not Found</CardTitle>
                    <CardDescription>
                        The student you're looking for doesn't exist or has been removed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        Please check the student ID and try again, or return to the students list
                        to find the correct student.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/students">
                            Back to Students
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}