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
                title: 'Error de Validación',
                description: 'Por favor, complete todos los campos obligatorios.',
                variant: 'destructive',
            })
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            toast({
                title: 'Error de Validación',
                description: 'Por favor, ingrese una dirección de correo electrónico válida.',
                variant: 'destructive',
            })
            return
        }

        // Basic phone number validation
        const phoneRegex = /^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/
        if (!phoneRegex.test(phone)) {
            toast({
                title: 'Error de Validación',
                description: 'Por favor, ingrese un número de teléfono válido.',
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
                throw new Error(error.error || 'Algo salió mal')
            }

            const result = await response.json()

            toast({
                title: isEditing ? 'Tutor Actualizado' : 'Tutor Creado',
                description: isEditing
                    ? `${name} ha sido actualizado exitosamente.`
                    : `${name} ha sido agregado exitosamente.`,
            })

            // Redirect to tutor detail page or tutors list
            router.push(isEditing ? `/tutors/${tutor?.id}` : '/tutors')
            router.refresh()
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Ocurrió un error',
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
                    <CardTitle>{isEditing ? 'Editar Tutor' : 'Agregar Nuevo Tutor'}</CardTitle>
                    <CardDescription>
                        {isEditing
                            ? 'Actualizar información del tutor y detalles de contacto'
                            : 'Ingrese información de contacto para un nuevo tutor/padre'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ingrese el nombre completo del tutor"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Dirección de Correo Electrónico *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="correo@ejemplo.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Número de Teléfono *</Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(123) 456-7890"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Textarea
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Dirección, ciudad, estado, código postal"
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
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Tutor' : 'Crear Tutor'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
