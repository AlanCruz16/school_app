'use client'

import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, FileText, Printer } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// Import the display map along with other formatters
import { formatCurrency, formatDate, formatMonth, paymentMethodDisplayMap } from '@/lib/utils/format' // Removed formatMonthYear

// Import PaymentMethod and PaymentType enum types
import { PaymentMethod as PrismaPaymentMethod, PaymentType } from '@prisma/client';

interface Payment {
    id: string
    amount: any
    paymentDate: string | Date
    paymentMethod: PrismaPaymentMethod // Use enum type
    paymentType?: PaymentType // Added (optional for backward compatibility)
    description?: string // Added
    forMonth?: number | null // Made nullable
    forYear?: number // Added (optional for backward compatibility)
    isPartial: boolean
    receiptNumber: string
    student: {
        name: string
        grade?: {
            name: string
        }
    }
    schoolYear: {
        name: string
    }
    clerk: {
        name: string
    }
}

interface PaymentHistoryProps {
    payments: Payment[]
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
    const handlePrintReceipt = (paymentId: string) => {
        // Open in a new tab and trigger print when loaded
        const receiptWindow = window.open(`/payments/${paymentId}/receipt`, '_blank');
        if (receiptWindow) {
            receiptWindow.onload = () => {
                receiptWindow.print();
            };
        }
    };

    return (
        <div className="rounded-md border">
            <div className="max-h-[700px] overflow-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Recibo No.</TableHead>
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Concepto</TableHead> {/* Changed from Month */}
                            <TableHead>Año Escolar</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead>Procesado Por</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                                <TableCell>{payment.receiptNumber}</TableCell>
                                <TableCell>
                                    <Link
                                        href={`/students/${payment.student.name}`}
                                        className="hover:underline"
                                    >
                                        {payment.student.name}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {/* Display Concept based on type */}
                                    {payment.paymentType === PaymentType.TUITION && payment.forMonth
                                        ? `Colegiatura - ${formatMonth(payment.forMonth)} ${payment.forYear || ''}`.trim()
                                        : payment.paymentType === PaymentType.INSCRIPTION
                                            ? `Inscripción ${payment.forYear || ''}`.trim()
                                            : payment.paymentType === PaymentType.OPTIONAL
                                                ? payment.description || 'Pago Opcional'
                                                : payment.forMonth // Fallback for older data
                                                    ? `Colegiatura - ${formatMonth(payment.forMonth)} ${payment.forYear || ''}`.trim()
                                                    : 'Pago'
                                    }
                                </TableCell>
                                <TableCell>{payment.schoolYear.name}</TableCell>
                                <TableCell>
                                    {/* Use the display map, fallback to raw value */}
                                    <Badge variant="outline">{paymentMethodDisplayMap[payment.paymentMethod] || payment.paymentMethod}</Badge>
                                </TableCell>
                                <TableCell>
                                    {payment.isPartial ? (
                                        <Badge variant="secondary">Parcial</Badge>
                                    ) : (
                                        <Badge variant="default">Completo</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(parseFloat(payment.amount.toString()))}
                                </TableCell>
                                <TableCell>{payment.clerk.name}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Acciones</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/payments/${payment.id}/receipt`}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Ver Recibo
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handlePrintReceipt(payment.id)}>
                                                <Printer className="mr-2 h-4 w-4" />
                                                Imprimir Recibo
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
