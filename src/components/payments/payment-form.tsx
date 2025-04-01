// src/components/payments/payment-form.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatMonth } from '@/lib/utils/format'
import { getAllSchoolYearMonths, formatMonthYear } from '@/lib/utils/balance'
import { Check, AlertCircle, Calendar } from 'lucide-react'
import { distributePayment } from '@/lib/utils/balance'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, BookOpen, Gift } from 'lucide-react' // Added icons

// Define the PaymentMethod and PaymentType enum types based on Prisma schema
import { PaymentMethod as PrismaPaymentMethod, PaymentType } from '@prisma/client';

// Define the mapping for the options available in the dropdown
const paymentMethodOptions = {
    [PrismaPaymentMethod.EFECTIVO]: '01 Efectivo',
    [PrismaPaymentMethod.CHEQUE_NOMINATIVO]: '02 Cheque nominativo',
    [PrismaPaymentMethod.TRANSFERENCIA]: '03 Transferencia electrónica de fondos',
    [PrismaPaymentMethod.TARJETA_CREDITO]: '04 Tarjeta de crédito',
    [PrismaPaymentMethod.TARJETA_DEBITO]: '28 Tarjeta de débito',
};

// Define options for Payment Type dropdown
const paymentTypeOptions = {
    [PaymentType.TUITION]: { label: 'Colegiatura', icon: DollarSign },
    [PaymentType.INSCRIPTION]: { label: 'Inscripción', icon: BookOpen },
    [PaymentType.OPTIONAL]: { label: 'Pago Opcional', icon: Gift },
};


// Define a separate map for displaying ALL possible values (including legacy)
const paymentMethodDisplayMap = {
    [PrismaPaymentMethod.CASH]: 'CASH', // Display legacy as is
    [PrismaPaymentMethod.CARD]: 'CARD', // Display legacy as is
    [PrismaPaymentMethod.EFECTIVO]: '01 Efectivo',
    [PrismaPaymentMethod.CHEQUE_NOMINATIVO]: '02 Cheque nominativo',
    [PrismaPaymentMethod.TRANSFERENCIA]: '03 Transferencia electrónica de fondos',
    [PrismaPaymentMethod.TARJETA_CREDITO]: '04 Tarjeta de crédito',
    [PrismaPaymentMethod.TARJETA_DEBITO]: '28 Tarjeta de débito',
};


interface Student {
    id: string
    name: string
    grade: {
        name: string
        tuitionAmount: any
        inscriptionCost?: any // Added inscription cost
        schoolYear: {
            id: string
            name: string
        }
    }
    payments?: any[] // Student might include payment history
}

interface Payment {
    id: string
    amount: any
    paymentDate: string | Date
    paymentMethod: PrismaPaymentMethod // Use the enum type
    paymentType?: PaymentType // Added
    description?: string | null // Allow null from Prisma
    forMonth?: number | null // Made nullable
    forYear?: number
    isPartial: boolean
    schoolYearId: string
}

interface PaymentFormProps {
    student: Student
    clerkId: string
    clerkName: string
    activeSchoolYear: {
        id: string
        name: string
        startDate: Date | string
        endDate: Date | string
    }
    initialMonth?: number
    initialYear?: number
    studentPayments?: Payment[] // Optional payment history
}

// Define a type for month payment status
type MonthStatus = 'paid' | 'partial' | 'unpaid';

// Define a type for month data
interface MonthData {
    month: number;
    year: number;
    key: string;
    status: MonthStatus;
    label: string;
    fee: number;
}

export default function PaymentForm({
    student,
    clerkId,
    clerkName,
    activeSchoolYear,
    initialMonth,
    initialYear,
    studentPayments = [] // Default to empty array if not provided
}: PaymentFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Fees based on grade
    const monthlyFee = parseFloat(student.grade?.tuitionAmount?.toString() || "0")
    const inscriptionFee = parseFloat(student.grade?.inscriptionCost?.toString() || "0")

    // Check if inscription has been paid for the active year
    const hasPaidInscription = useMemo(() => {
        return studentPayments.some(p =>
            p.paymentType === PaymentType.INSCRIPTION &&
            p.schoolYearId === activeSchoolYear.id
        );
    }, [studentPayments, activeSchoolYear.id]);

    // Filter available payment types
    const availablePaymentTypes = useMemo(() => {
        // Start with TUITION and OPTIONAL which are always available
        // Use Partial to allow INSCRIPTION to be potentially missing
        const options: Partial<typeof paymentTypeOptions> = {
            [PaymentType.TUITION]: paymentTypeOptions[PaymentType.TUITION],
            [PaymentType.OPTIONAL]: paymentTypeOptions[PaymentType.OPTIONAL],
        };
        // Conditionally add INSCRIPTION if it hasn't been paid
        if (!hasPaidInscription) {
            options[PaymentType.INSCRIPTION] = paymentTypeOptions[PaymentType.INSCRIPTION];
        }
        // Note: This might change the order. If order matters, consider using Object.entries and filter/map.
        // For now, this ensures the correct types are available.
        return options;
    }, [hasPaidInscription]);

    // Determine initial payment type (avoid INSCRIPTION if paid)
    const initialPaymentType = hasPaidInscription ? PaymentType.TUITION : PaymentType.TUITION; // Default to TUITION

    // Form state
    const [paymentMethod, setPaymentMethod] = useState<PrismaPaymentMethod>(PrismaPaymentMethod.EFECTIVO)
    const [selectedMonths, setSelectedMonths] = useState<string[]>([])
    const [paymentType, setPaymentType] = useState<PaymentType>(initialPaymentType)
    const [description, setDescription] = useState('')
    const [isPartial, setIsPartial] = useState(false)
    // Adjust initial amount based on initial type
    const [amount, setAmount] = useState(initialPaymentType === PaymentType.TUITION ? monthlyFee.toString() : (initialPaymentType === PaymentType.INSCRIPTION ? inscriptionFee.toString() : ''))
    const [notes, setNotes] = useState('')
    const [payments, setPayments] = useState<Payment[]>(studentPayments || [])
    const [paymentMode, setPaymentMode] = useState<'specific' | 'bulk'>('specific') // Only relevant for TUITION
    const [bulkPreviewExpanded, setBulkPreviewExpanded] = useState(false) // Only relevant for TUITION

    // Initialize payments state and fetch if necessary
    useEffect(() => {
        let isMounted = true;
        setIsLoading(true); // Start loading

        const initializeAndFetchPayments = async () => {
            if (studentPayments && studentPayments.length > 0) {
                // Use provided payments
                if (isMounted) {
                    setPayments(studentPayments);
                    setIsLoading(false);
                }
            } else {
                // Fetch payments if not provided
                try {
                    const response = await fetch(`/api/payments?studentId=${student.id}&schoolYearId=${activeSchoolYear.id}`);
                    if (!response.ok) {
                        throw new Error('Error al cargar el historial de pagos');
                    }
                    const data = await response.json();
                    if (isMounted) {
                        setPayments(data);
                    }
                } catch (error) {
                    console.error('Error fetching payment history:', error);
                    if (isMounted) {
                        toast({
                            title: 'Advertencia',
                            description: 'No se pudo cargar el historial de pagos. El estado de los meses podría ser inexacto.',
                            variant: 'destructive',
                        });
                        // Keep payments as empty array on error
                        setPayments([]);
                    }
                } finally {
                    if (isMounted) {
                        setIsLoading(false); // Stop loading after fetch attempt
                    }
                }
            }
        };

        initializeAndFetchPayments();

        // Cleanup function
        return () => {
            isMounted = false;
        };
        // Dependencies: student.id and activeSchoolYear.id trigger refetch if they change
        // Removed studentPayments from dependencies to prevent infinite loop if prop reference changes
    }, [student.id, activeSchoolYear.id, toast]);

    // Compute available months based on school year and payment history (Only relevant for TUITION)
    const availableMonths = useMemo(() => {
        if (paymentType !== PaymentType.TUITION) return [];

        const allMonths = getAllSchoolYearMonths(activeSchoolYear);

        return allMonths.map(monthYear => {
            // --- DEBUG LOG ---
            console.log('Processing:', monthYear);
            const monthPayments = payments.filter(payment => {
                // Ensure payment is for tuition before considering it for month status
                const isTuition = !payment.paymentType || payment.paymentType === PaymentType.TUITION;
                if (!isTuition) return false;

                if (payment.forYear) {
                    return payment.forMonth === monthYear.month &&
                        Number(payment.forYear) === Number(monthYear.year) && // Ensure type-safe comparison
                        payment.schoolYearId === activeSchoolYear.id;
                } else {
                    return payment.forMonth === monthYear.month &&
                        payment.schoolYearId === activeSchoolYear.id;
                }
            });

            const totalPaid = monthPayments.reduce((sum, payment) => {
                const paymentAmount = typeof payment.amount === 'object'
                    ? parseFloat(payment.amount.toString())
                    : typeof payment.amount === 'string'
                        ? parseFloat(payment.amount)
                        : payment.amount;
                return sum + (isNaN(paymentAmount) ? 0 : paymentAmount);
            }, 0);

            // --- DEBUG LOG ---
            console.log('Filtered Payments for month:', monthPayments);
            console.log('Calculated totalPaid:', totalPaid);

            let status: MonthStatus = 'unpaid';
            // Add tolerance for floating point comparison
            if (totalPaid >= monthlyFee - 0.001) {
                status = 'paid';
            } else if (totalPaid > 0) {
                status = 'partial';
            }

            // --- DEBUG LOG ---
            console.log('Assigned status:', status);

            const label = `${formatMonth(monthYear.month)} ${monthYear.year}${status !== 'unpaid' ?
                ` (${status === 'paid' ? 'Pagado Completo' : `Parcial: ${formatCurrency(totalPaid)}`})` : ''}`;

            return {
                month: monthYear.month,
                year: monthYear.year,
                key: monthYear.key,
                status,
                label,
                fee: monthlyFee
            };
        });
    }, [activeSchoolYear, payments, monthlyFee, paymentType]);

    // Calculate unpaid months for distribution (Only relevant for TUITION)
    const unpaidMonthsForDistribution = useMemo(() => {
        if (paymentType !== PaymentType.TUITION) return [];

        return availableMonths
            .filter(month => month.status !== 'paid')
            .map(month => {
                const monthPayments = payments.filter(payment => {
                    if (payment.forYear) {
                        return payment.forMonth === month.month &&
                            payment.forYear === month.year &&
                            payment.schoolYearId === activeSchoolYear.id;
                    } else {
                        return payment.forMonth === month.month &&
                            payment.schoolYearId === activeSchoolYear.id;
                    }
                });

                const paidAmount = monthPayments.reduce((sum, payment) => {
                    const paymentAmount = typeof payment.amount === 'object'
                        ? parseFloat(payment.amount.toString())
                        : typeof payment.amount === 'string'
                            ? parseFloat(payment.amount)
                            : payment.amount;
                    return sum + (isNaN(paymentAmount) ? 0 : paymentAmount);
                }, 0);

                return {
                    monthYear: {
                        month: month.month,
                        year: month.year,
                        key: month.key
                    },
                    status: month.status as 'paid' | 'partial' | 'unpaid',
                    expectedAmount: monthlyFee,
                    paidAmount
                };
            });
    }, [availableMonths, payments, monthlyFee, paymentType]);

    // Calculate total unpaid amount (Only relevant for TUITION)
    const totalUnpaidAmount = useMemo(() => {
        if (paymentType !== PaymentType.TUITION) return 0;
        return unpaidMonthsForDistribution.reduce(
            (sum, month) => sum + (month.expectedAmount - (month.paidAmount || 0)),
            0
        );
    }, [unpaidMonthsForDistribution, paymentType]);

    // Calculate distribution based on current payment amount (Only relevant for TUITION bulk mode)
    const paymentDistribution = useMemo(() => {
        if (paymentType !== PaymentType.TUITION || paymentMode !== 'bulk') return [];
        const paymentVal = parseFloat(amount) || 0;
        if (paymentVal <= 0) return [];

        return distributePayment(paymentVal, unpaidMonthsForDistribution);
    }, [amount, unpaidMonthsForDistribution, paymentType, paymentMode]);

    // Get unpaid and partially paid months (Only relevant for TUITION)
    const availablePaymentMonths = useMemo(() => {
        if (paymentType !== PaymentType.TUITION) return [];
        return availableMonths.filter(m => m.status !== 'paid');
    }, [availableMonths, paymentType]);

    // Update amount when selection, partial status, or payment type changes
    useEffect(() => {
        if (paymentType === PaymentType.TUITION && paymentMode === 'specific' && !isPartial) {
            setAmount((selectedMonths.length * monthlyFee).toString());
        }
        // Note: We don't automatically clear amount when switching type to allow flexibility
    }, [selectedMonths, isPartial, monthlyFee, paymentType, paymentMode]);

    // Handle month checkbox toggle (Only relevant for TUITION specific mode)
    const toggleMonth = (monthKey: string) => {
        if (paymentType !== PaymentType.TUITION || paymentMode !== 'specific') return;
        setSelectedMonths(prevSelected => {
            if (prevSelected.includes(monthKey)) {
                return prevSelected.filter(key => key !== monthKey);
            } else {
                return [...prevSelected, monthKey];
            }
        });
    };

    // Get selected month details (Only relevant for TUITION specific mode)
    const selectedMonthsData = useMemo(() => {
        if (paymentType !== PaymentType.TUITION || paymentMode !== 'specific') return [];
        return availableMonths
            .filter(month => selectedMonths.includes(month.key))
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });
    }, [selectedMonths, availableMonths, paymentType, paymentMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // --- Universal Validations ---
        if (!amount) {
            toast({ title: 'Error de Validación', description: 'Por favor, ingrese un monto de pago.', variant: 'destructive' })
            return
        }
        const paymentAmount = parseFloat(amount)
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            toast({ title: 'Error de Validación', description: 'Por favor, ingrese un monto de pago válido mayor que cero.', variant: 'destructive' })
            return
        }
        if (paymentType === PaymentType.OPTIONAL && !description) {
            toast({ title: 'Error de Validación', description: 'Por favor, ingrese una descripción para el pago opcional.', variant: 'destructive' })
            return
        }

        // --- TUITION Specific Validations ---
        if (paymentType === PaymentType.TUITION) {
            if (paymentMode === 'specific' && selectedMonths.length === 0) {
                toast({ title: 'Error de Validación', description: 'Por favor, seleccione al menos un mes para el pago de colegiatura.', variant: 'destructive' })
                return
            }
            if (paymentMode === 'specific' && !isPartial) {
                const expectedTotal = selectedMonths.length * monthlyFee;
                if (paymentAmount !== expectedTotal) {
                    setIsPartial(true)
                    toast({ title: 'Aviso', description: `El monto ${formatCurrency(paymentAmount)} no coincide con el total esperado ${formatCurrency(expectedTotal)}. Marcado como pago parcial.`, variant: 'default' })
                }
            }
        }

        setIsSubmitting(true)

        try {
            let paymentData: any = {
                studentId: student.id,
                amount: paymentAmount,
                paymentMethod,
                paymentType,
                schoolYearId: activeSchoolYear.id,
                clerkId,
                notes: notes || null,
                forYear: new Date().getFullYear(), // Default year, API might override
            };

            if (paymentType === PaymentType.TUITION) {
                if (paymentMode === 'specific') {
                    const monthsData = selectedMonthsData.map(month => ({ month: month.month, year: month.year, fee: month.fee }));
                    paymentData = {
                        ...paymentData,
                        months: monthsData,
                        isPartial: isPartial || paymentAmount < (selectedMonths.length * monthlyFee),
                        forMonth: monthsData.length > 0 ? monthsData[0].month : null,
                        forYear: monthsData.length > 0 ? monthsData[0].year : new Date().getFullYear(),
                    };
                } else { // Bulk mode
                    const monthsData = paymentDistribution.map(allocation => ({ month: allocation.monthYear.month, year: allocation.monthYear.year, fee: monthlyFee, allocation: allocation.amount }));
                    paymentData = {
                        ...paymentData,
                        months: monthsData,
                        isPartial: paymentAmount < totalUnpaidAmount,
                        isBulkPayment: true,
                        forMonth: monthsData.length > 0 ? monthsData[0].month : null,
                        forYear: monthsData.length > 0 ? monthsData[0].year : new Date().getFullYear(),
                    };
                }
            } else if (paymentType === PaymentType.INSCRIPTION) {
                paymentData = { ...paymentData, isPartial: false };
            } else if (paymentType === PaymentType.OPTIONAL) {
                paymentData = { ...paymentData, description: description, isPartial: false };
            }

            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Algo salió mal')
            }

            const result = await response.json()

            toast({ title: 'Pago Registrado', description: `${paymentTypeOptions[paymentType].label} de ${formatCurrency(paymentAmount)} para ${student.name} registrado.` })

            router.push(`/payments/${result.payment.id}/receipt`)
            router.refresh()
        } catch (error) {
            toast({ title: 'Error', description: error instanceof Error ? error.message : 'Ocurrió un error', variant: 'destructive' })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!student.grade) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Falta Información de Grado</CardTitle>
                    <CardDescription>Este estudiante no tiene una asignación de grado válida.</CardDescription>
                </CardHeader>
                <CardContent><p>Antes de registrar pagos, este estudiante necesita ser asignado a un grado con un monto de colegiatura válido.</p></CardContent>
                <CardFooter className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Regresar</Button>
                    <Button asChild><Link href={`/students/${student.id}/edit`}>Editar Estudiante</Link></Button>
                </CardFooter>
            </Card>
        )
    }

    const isTuitionMode = paymentType === PaymentType.TUITION;

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Nuevo Pago</CardTitle>
                    <CardDescription>Registrar un pago para {student.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Student Information */}
                    <div className="rounded-md bg-muted p-4">
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Estudiante</div>
                            <div className="text-lg font-bold">{student.name}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <div className="text-sm font-medium">Grado</div>
                                <div>{student.grade?.name} ({student.grade?.schoolYear?.name || "Sin año escolar"})</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium">Cuota Mensual</div>
                                <div className="font-bold">{formatCurrency(monthlyFee)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Type Selection */}
                    <div className="space-y-3">
                        <Label htmlFor="paymentType">Tipo de Pago</Label>
                        <Select
                            value={paymentType}
                            onValueChange={(value) => {
                                const newType = value as PaymentType;
                                setPaymentType(newType);
                                if (newType === PaymentType.TUITION) {
                                    setAmount(monthlyFee.toString());
                                    setIsPartial(false);
                                    setSelectedMonths([]);
                                } else if (newType === PaymentType.INSCRIPTION) {
                                    setAmount(inscriptionFee.toString());
                                    setIsPartial(false); // Inscription is typically not partial
                                } else { // Optional
                                    setAmount('');
                                }
                                setDescription('');
                            }}
                        >
                            <SelectTrigger id="paymentType"><SelectValue placeholder="Seleccionar tipo de pago" /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(availablePaymentTypes).map(([key, { label, icon: Icon }]) => ( // Use filtered types
                                    <SelectItem key={key} value={key}>
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                            <span>{label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Optional Payment Description */}
                    {paymentType === PaymentType.OPTIONAL && (
                        <div className="space-y-3">
                            <Label htmlFor="description">Descripción *</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej., Compra de uniforme, Cuota de viaje escolar" required />
                        </div>
                    )}

                    {/* Payment Method */}
                    <div className="space-y-3">
                        <Label htmlFor="paymentMethod">Método de Pago</Label>
                        <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PrismaPaymentMethod)}>
                            <SelectTrigger id="paymentMethod"><SelectValue placeholder="Seleccionar método de pago" /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(paymentMethodOptions).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>{value}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Payment Mode Selection (Only for TUITION) */}
                    {isTuitionMode && (
                        <div className="space-y-3">
                            <Label>Modo de Pago (Colegiatura)</Label>
                            <Tabs value={paymentMode} onValueChange={(value) => setPaymentMode(value as 'specific' | 'bulk')} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="specific" className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Meses Específicos</span></TabsTrigger>
                                    <TabsTrigger value="bulk" className="flex items-center gap-2"><DollarSign className="h-4 w-4" /><span>Pago Masivo</span></TabsTrigger>
                                </TabsList>
                                <TabsContent value="specific" className="mt-4">
                                    {/* Month Selection */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Seleccionar Meses a Pagar *</Label>
                                            <div className="text-xs text-muted-foreground">{selectedMonths.length} mes{selectedMonths.length !== 1 ? 'es' : ''} seleccionado{selectedMonths.length !== 1 ? 's' : ''}</div>
                                        </div>
                                        {isLoading ? (
                                            <div className="h-[200px] w-full rounded-md border bg-muted animate-pulse" />
                                        ) : availablePaymentMonths.length > 0 ? (
                                            <div className="max-h-[300px] overflow-y-auto rounded-md border p-4">
                                                <div className="space-y-2">
                                                    {availablePaymentMonths.map((monthData) => (
                                                        <div key={monthData.key} className="flex items-center space-x-2">
                                                            <Checkbox id={`month-${monthData.key}`} checked={selectedMonths.includes(monthData.key)} onCheckedChange={() => toggleMonth(monthData.key)} />
                                                            <Label htmlFor={`month-${monthData.key}`} className="flex items-center cursor-pointer">
                                                                <span className="flex-1">{formatMonth(monthData.month)} {monthData.year}</span>
                                                                {monthData.status === 'partial' && (<Badge variant="secondary" className="ml-2">Parcial</Badge>)}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-md border p-3 bg-green-50 text-green-800 flex items-center"><Check className="mr-2 h-4 w-4" /><span>Todos los meses para este año escolar han sido pagados completamente.</span></div>
                                        )}
                                    </div>
                                    {/* Selected Month Summary */}
                                    {selectedMonths.length > 0 && (
                                        <div className="rounded-md border p-4 bg-secondary/20 mt-4">
                                            <h4 className="font-medium text-sm mb-2 flex items-center"><Calendar className="h-4 w-4 mr-2" />Resumen de Pago</h4>
                                            <div className="space-y-1 text-sm">
                                                {selectedMonthsData.map(month => (<div key={month.key} className="flex justify-between"><span>{formatMonth(month.month)} {month.year}</span><span>{formatCurrency(month.fee)}</span></div>))}
                                                <div className="flex justify-between font-bold pt-2 border-t mt-2"><span>Total</span><span>{formatCurrency(selectedMonths.length * monthlyFee)}</span></div>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="bulk" className="mt-4">
                                    {/* Bulk Payment UI */}
                                    <div className="space-y-4">
                                        <div className="rounded-md border p-4">
                                            <h4 className="font-medium mb-2 flex items-center"><DollarSign className="h-4 w-4 mr-2" />Pago Masivo</h4>
                                            <p className="text-sm text-muted-foreground mb-3">Realice un pago sin seleccionar meses específicos. El sistema distribuirá automáticamente el pago a los meses impagos más antiguos primero.</p>
                                            {unpaidMonthsForDistribution.length === 0 ? (
                                                <div className="rounded-md border p-3 bg-green-50 text-green-800 flex items-center"><Check className="mr-2 h-4 w-4" /><span>Todos los meses para este año escolar han sido pagados completamente.</span></div>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between items-center text-sm font-medium py-2 border-b"><span>Saldo pendiente total:</span><span className="text-destructive font-bold">{formatCurrency(totalUnpaidAmount)}</span></div>
                                                    <div className="mt-3">
                                                        <Label htmlFor="bulkAmount">Monto del Pago *</Label>
                                                        <div className="relative mt-1">
                                                            <span className="absolute left-3 top-2.5">$</span>
                                                            <Input id="bulkAmount" type="number" step="0.01" min="0.01" max={totalUnpaidAmount} value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-8" />
                                                        </div>
                                                    </div>
                                                    {/* Payment distribution preview */}
                                                    {parseFloat(amount) > 0 && (
                                                        <div className="mt-4">
                                                            <div className="flex justify-between items-center cursor-pointer" onClick={(e) => { e.preventDefault(); setBulkPreviewExpanded(!bulkPreviewExpanded); }}>
                                                                <h5 className="font-medium text-sm">Vista Previa de Distribución de Pago</h5>
                                                                <Button type="button" variant="ghost" size="sm" className="h-6 px-2">{bulkPreviewExpanded ? 'Ocultar' : 'Mostrar'} Detalles</Button>
                                                            </div>
                                                            {bulkPreviewExpanded && (
                                                                <div className="mt-2 space-y-1 text-sm max-h-[200px] overflow-y-auto border rounded-md p-2">
                                                                    {paymentDistribution.length > 0 ? (
                                                                        <>
                                                                            {paymentDistribution.map(allocation => (
                                                                                <div key={allocation.monthYear.key} className="flex justify-between items-center py-1 border-b last:border-0">
                                                                                    <span>{formatMonth(allocation.monthYear.month)} {allocation.monthYear.year}</span>
                                                                                    <div className="flex flex-col items-end">
                                                                                        <span>{formatCurrency(allocation.amount)}</span>
                                                                                        {allocation.isPartial && (<span className="text-xs text-yellow-600">Parcial</span>)}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </>
                                                                    ) : (<div className="text-center py-2 text-muted-foreground">Ingrese un monto de pago para ver la distribución</div>)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {parseFloat(amount) > 0 && parseFloat(amount) < totalUnpaidAmount && (
                                            <div className="rounded-md border p-3 bg-yellow-50 text-yellow-700 flex items-center text-sm"><AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" /><span>Este monto pagará parcialmente algunos meses. Se priorizarán los meses impagos más antiguos.</span></div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    {/* Partial Payment Toggle (Only for TUITION specific mode) */}
                    {isTuitionMode && paymentMode === 'specific' && (
                        <div className="flex items-center space-x-2">
                            <Switch id="partial" checked={isPartial} onCheckedChange={setIsPartial} />
                            <Label htmlFor="partial">Pago parcial (Colegiatura)</Label>
                        </div>
                    )}

                    {/* Payment Amount */}
                    <div className="space-y-3">
                        <Label htmlFor="amount">Monto *</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5">$</span>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={isTuitionMode && paymentMode === 'bulk' ? (totalUnpaidAmount > 0 ? totalUnpaidAmount : undefined) : undefined}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-8"
                                readOnly={paymentType === PaymentType.INSCRIPTION} // Make read-only for inscription
                                disabled={
                                    (paymentType === PaymentType.INSCRIPTION) || // Disable if inscription type
                                    (isTuitionMode && paymentMode === 'specific' && !isPartial && (availablePaymentMonths.length === 0 || selectedMonths.length === 0)) ||
                                    (isTuitionMode && paymentMode === 'bulk' && unpaidMonthsForDistribution.length === 0)
                                }
                                required
                            />
                        </div>
                        {isTuitionMode && (
                            <div className="text-sm text-muted-foreground">
                                {paymentMode === 'bulk'
                                    ? `Pago máximo: ${formatCurrency(totalUnpaidAmount)}`
                                    : (isPartial
                                        ? "Ingrese el monto parcial que se está pagando por el/los mes(es) seleccionado(s)."
                                        : `Monto de pago completo para el/los mes(es) seleccionado(s): ${formatCurrency(selectedMonths.length * monthlyFee)}`)
                                }
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <Label htmlFor="notes">Notas (opcional)</Label>
                        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Agregue cualquier información adicional sobre este pago" />
                    </div>

                    {/* Receipt Preview */}
                    <div className="rounded-md border p-4">
                        <h3 className="font-semibold">Vista Previa del Recibo</h3>
                        <div className="mt-2 space-y-1 text-sm">
                            <div className="grid grid-cols-2"><span className="text-muted-foreground">Estudiante:</span><span>{student.name}</span></div>
                            <div className="grid grid-cols-2"><span className="text-muted-foreground">Fecha:</span><span>{new Date().toLocaleDateString()}</span></div>
                            <div className="grid grid-cols-2"><span className="text-muted-foreground">Monto:</span><span>{formatCurrency(parseFloat(amount) || 0)}</span></div>
                            <div className="grid grid-cols-2">
                                <span className="text-muted-foreground">Concepto:</span>
                                <span>
                                    {paymentType === PaymentType.TUITION
                                        ? (selectedMonthsData.length
                                            ? (selectedMonthsData.length > 1 ? `Colegiatura - Varios meses (${selectedMonthsData.length})` : `Colegiatura - ${formatMonthYear(selectedMonthsData[0])}`)
                                            : (paymentMode === 'bulk' ? 'Colegiatura - Pago Masivo' : 'Colegiatura'))
                                        : (paymentType === PaymentType.INSCRIPTION ? 'Cuota de Inscripción' : (description || 'Pago Opcional'))
                                    }
                                </span>
                            </div>
                            <div className="grid grid-cols-2"><span className="text-muted-foreground">Método de Pago:</span><span>{paymentMethodDisplayMap[paymentMethod] || paymentMethod}</span></div>
                            <div className="grid grid-cols-2"><span className="text-muted-foreground">Procesado por:</span><span>{clerkName}</span></div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                    <Button
                        type="submit"
                        disabled={
                            isSubmitting ||
                            parseFloat(amount) <= 0 ||
                            (isTuitionMode && paymentMode === 'specific' && selectedMonths.length === 0) ||
                            (isTuitionMode && paymentMode === 'bulk' && unpaidMonthsForDistribution.length === 0) ||
                            (paymentType === PaymentType.OPTIONAL && !description)
                        }
                    >
                        {isSubmitting ? 'Procesando...' : `Registrar ${paymentTypeOptions[paymentType].label}`}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
