'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

interface Grade {
    id: string
    name: string
    schoolYear: {
        name: string
    }
}

interface Tutor {
    id: string
    name: string
}

interface StudentFormProps {
    grades: Grade[]
    tutors: Tutor[]
    student?: {
        id: string
        name: string
        gradeId: string
        tutorId: string
        active: boolean
    }
    isEditing?: boolean
}

export default function StudentForm({
    grades,
    tutors,
    student,
    isEditing = false
}: StudentFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    // Form state
    const [name, setName] = useState(student?.name || '')
    const [gradeId, setGradeId] = useState(student?.gradeId || '')
    const [tutorId, setTutorId] = useState(student?.tutorId || '')
    const [active, setActive] = useState(student?.active !== undefined ? student.active : true)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name || !gradeId || !tutorId) {
            toast({
                title: 'Validation Error',
                description: 'Please fill out all required fields.',
                variant: 'destructive',
            })
            return
        }

        setIsSubmitting(true)

        try {
            const studentData = {
                name,
                gradeId,
                tutorId,
                active,
            }

            const url = isEditing
                ? `/api/students/${student?.id}`
                : '/api/students'

            const method = isEditing ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studentData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Something went wrong')
            }

            const result = await response.json()

            toast({
                title: isEditing ? 'Student Updated' : 'Student Created',
                description: isEditing
                    ? `${name} has been updated successfully.`
                    : `${name} has been added successfully.`,
            })

            // Redirect to student detail page or students list
            router.push(isEditing ? `/students/${student?.id}` : '/students')
            router.refresh()
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'An error occurred',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>{isEditing ? 'Edit Student' : 'Add New Student'}</CardTitle>
                    <CardDescription>
                        {isEditing
                            ? 'Update student information and grade assignment'
                            : 'Enter basic information to register a new student'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Student Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter student's full name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="grade">Grade *</Label>
                        <Select
                            value={gradeId}
                            onValueChange={setGradeId}
                            required
                        >
                            <SelectTrigger id="grade">
                                <SelectValue placeholder="Select a grade" />
                            </SelectTrigger>
                            <SelectContent>
                                {grades.map((grade) => (
                                    <SelectItem key={grade.id} value={grade.id}>
                                        {grade.name} ({grade.schoolYear.name})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tutor">Tutor/Parent *</Label>
                        <Select
                            value={tutorId}
                            onValueChange={setTutorId}
                            required
                        >
                            <SelectTrigger id="tutor">
                                <SelectValue placeholder="Select a tutor" />
                            </SelectTrigger>
                            <SelectContent>
                                {tutors.map((tutor) => (
                                    <SelectItem key={tutor.id} value={tutor.id}>
                                        {tutor.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="text-sm text-muted-foreground mt-1">
                            <Link href="/tutors/new" className="text-primary hover:underline" target="_blank">
                                + Add a new tutor
                            </Link>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="active"
                                checked={active}
                                onCheckedChange={setActive}
                            />
                            <Label htmlFor="active">Student is active</Label>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : isEditing ? 'Update Student' : 'Create Student'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}