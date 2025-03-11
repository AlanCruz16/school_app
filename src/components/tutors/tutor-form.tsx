'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface TutorFormProps {
    tutor?: {
        id: string
        name: string
        email: string
        phone: string
        address?: string | null
    }
    isEditing?: boolean
}

export default function TutorForm({ tutor, isEditing = false }: TutorFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    // Form state
    const [name, setName] = useState(tutor?.name || '')
    const [email, setEmail] = useState(tutor?.email || '')
    const [phone, setPhone] = useState(tutor?.phone || '')
    const [address, setAddress] = useState(tutor?.address || '')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name || !email || !phone) {
            toast({
                title: 'Validation Error',
                description: 'Please fill out all required fields.',
                variant: 'destructive',
            })
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            toast({
                title: 'Validation Error',
                description: 'Please enter a valid email address.',
                variant: 'destructive',
            })
            return
        }

        // Basic phone number validation
        const phoneRegex = /^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/
        if (!phoneRegex.test(phone)) {
            toast({
                title: 'Validation Error',
                description: 'Please enter a valid phone number.',
                variant: 'destructive',
            })
            return
        }

        setIsSubmitting(true)

        try {
            const tutorData = {
                name,
                email,
                phone,
                address: address || null,
            }

            const url = isEditing
                ? `/api/tutors/${tutor?.id}`
                : '/api/tutors'

            const method = isEditing ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tutorData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Something went wrong')
            }

            const result = await response.json()

            toast({
                title: isEditing ? 'Tutor Updated' : 'Tutor Created',
                description: isEditing
                    ? `${name} has been updated successfully.`
                    : `${name} has been added successfully.`,
            })

            // Redirect to tutor detail page or tutors list
            router.push(isEditing ? `/tutors/${tutor?.id}` : '/tutors')
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
                    <CardTitle>{isEditing ? 'Edit Tutor' : 'Add New Tutor'}</CardTitle>
                    <CardDescription>
                        {isEditing
                            ? 'Update tutor information and contact details'
                            : 'Enter contact information for a new tutor/parent'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter tutor's full name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(123) 456-7890"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Street address, city, state, zip code"
                            rows={3}
                        />
                    </div>
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
                        {isSubmitting ? 'Saving...' : isEditing ? 'Update Tutor' : 'Create Tutor'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}