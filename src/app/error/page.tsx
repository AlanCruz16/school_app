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
                    <CardTitle className="text-2xl font-bold text-red-600">Error de Autenticación</CardTitle>
                    <CardDescription>
                        Hubo un problema con su intento de inicio de sesión
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p>
                            Su intento de inicio de sesión falló. Esto podría deberse a:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Correo electrónico o contraseña incorrectos</li>
                            <li>Su cuenta puede estar desactivada</li>
                            <li>No tiene permiso para acceder a este sistema</li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/login">
                            Intentar de Nuevo
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
