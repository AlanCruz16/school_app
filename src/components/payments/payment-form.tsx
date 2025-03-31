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
    [PaymentType.TUITION]: { label: 'Tuition Fee', icon: DollarSign },
    [PaymentType.INSCRIPTION]: { label: 'Inscription Fee', icon: BookOpen },
    [PaymentType.OPTIONAL]: { label: 'Optional Payment', icon: Gift },
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
    description?: string // Added
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

    // Monthly fee based on grade
    const monthlyFee = parseFloat(student.grade?.tuitionAmount?.toString() || "0")

    // Form state
    const [paymentMethod, setPaymentMethod] = useState<PrismaPaymentMethod>(PrismaPaymentMethod.EFECTIVO)
    const [selectedMonths, setSelectedMonths] = useState<string[]>([])
    const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.TUITION)
    const [description, setDescription] = useState('')
    const [isPartial, setIsPartial] = useState(false)
    const [amount, setAmount] = useState(paymentType === PaymentType.TUITION ? monthlyFee.toString() : '')
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
                        throw new Error('Failed to fetch payment history');
                    }
                    const data = await response.json();
                    if (isMounted) {
                        setPayments(data);
                    }
                } catch (error) {
                    console.error('Error fetching payment history:', error);
                    if (isMounted) {
                        toast({
                            title: 'Warning',
                            description: 'Could not load payment history. Month status might be inaccurate.',
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
                ` (${status === 'paid' ? 'Fully Paid' : `Partial: ${formatCurrency(totalPaid)}`})` : ''}`;

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
            toast({ title: 'Validation Error', description: 'Please enter a payment amount.', variant: 'destructive' })
            return
        }
        const paymentAmount = parseFloat(amount)
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            toast({ title: 'Validation Error', description: 'Please enter a valid payment amount greater than zero.', variant: 'destructive' })
            return
        }
        if (paymentType === PaymentType.OPTIONAL && !description) {
            toast({ title: 'Validation Error', description: 'Please enter a description for the optional payment.', variant: 'destructive' })
            return
        }

        // --- TUITION Specific Validations ---
        if (paymentType === PaymentType.TUITION) {
            if (paymentMode === 'specific' && selectedMonths.length === 0) {
                toast({ title: 'Validation Error', description: 'Please select at least one month for tuition payment.', variant: 'destructive' })
                return
            }
            if (paymentMode === 'specific' && !isPartial) {
                const expectedTotal = selectedMonths.length * monthlyFee;
                if (paymentAmount !== expectedTotal) {
                    setIsPartial(true)
                    toast({ title: 'Notice', description: `Amount ${formatCurrency(paymentAmount)} does not match expected total ${formatCurrency(expectedTotal)}. Marked as partial payment.`, variant: 'default' })
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
                throw new Error(error.error || 'Something went wrong')
            }

            const result = await response.json()

            toast({ title: 'Payment Recorded', description: `${paymentTypeOptions[paymentType].label} of ${formatCurrency(paymentAmount)} for ${student.name} recorded.` })

            router.push(`/payments/${result.payment.id}/receipt`)
            router.refresh()
        } catch (error) {
            toast({ title: 'Error', description: error instanceof Error ? error.message : 'An error occurred', variant: 'destructive' })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!student.grade) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Missing Grade Information</CardTitle>
                    <CardDescription>This student doesn't have a valid grade assignment.</CardDescription>
                </CardHeader>
                <CardContent><p>Before recording payments, this student needs to be assigned to a grade with a valid tuition amount.</p></CardContent>
                <CardFooter className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Go Back</Button>
                    <Button asChild><Link href={`/students/${student.id}/edit`}>Edit Student</Link></Button>
                </CardFooter>
            </Card>
        )
    }

    const isTuitionMode = paymentType === PaymentType.TUITION;

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>New Payment</CardTitle>
                    <CardDescription>Record a payment for {student.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Student Information */}
                    <div className="rounded-md bg-muted p-4">
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Student</div>
                            <div className="text-lg font-bold">{student.name}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <div className="text-sm font-medium">Grade</div>
                                <div>{student.grade?.name} ({student.grade?.schoolYear?.name || "No school year"})</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium">Monthly Fee</div>
                                <div className="font-bold">{formatCurrency(monthlyFee)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Type Selection */}
                    <div className="space-y-3">
                        <Label htmlFor="paymentType">Payment Type</Label>
                        <Select
                            value={paymentType}
                            onValueChange={(value) => {
                                const newType = value as PaymentType;
                                setPaymentType(newType);
                                if (newType === PaymentType.TUITION) {
                                    setAmount(monthlyFee.toString());
                                    setIsPartial(false);
                                    setSelectedMonths([]);
                                } else {
                                    setAmount('');
                                }
                                setDescription('');
                            }}
                        >
                            <SelectTrigger id="paymentType"><SelectValue placeholder="Select payment type" /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(paymentTypeOptions).map(([key, { label, icon: Icon }]) => (
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
                            <Label htmlFor="description">Description *</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Uniform purchase, School trip fee" required />
                        </div>
                    )}

                    {/* Payment Method */}
                    <div className="space-y-3">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PrismaPaymentMethod)}>
                            <SelectTrigger id="paymentMethod"><SelectValue placeholder="Select payment method" /></SelectTrigger>
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
                            <Label>Payment Mode (Tuition)</Label>
                            <Tabs value={paymentMode} onValueChange={(value) => setPaymentMode(value as 'specific' | 'bulk')} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="specific" className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Specific Months</span></TabsTrigger>
                                    <TabsTrigger value="bulk" className="flex items-center gap-2"><DollarSign className="h-4 w-4" /><span>Bulk Payment</span></TabsTrigger>
                                </TabsList>
                                <TabsContent value="specific" className="mt-4">
                                    {/* Month Selection */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Select Months to Pay *</Label>
                                            <div className="text-xs text-muted-foreground">{selectedMonths.length} month{selectedMonths.length !== 1 ? 's' : ''} selected</div>
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
                                                                {monthData.status === 'partial' && (<Badge variant="secondary" className="ml-2">Partial</Badge>)}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-md border p-3 bg-green-50 text-green-800 flex items-center"><Check className="mr-2 h-4 w-4" /><span>All months for this school year have been fully paid.</span></div>
                                        )}
                                    </div>
                                    {/* Selected Month Summary */}
                                    {selectedMonths.length > 0 && (
                                        <div className="rounded-md border p-4 bg-secondary/20 mt-4">
                                            <h4 className="font-medium text-sm mb-2 flex items-center"><Calendar className="h-4 w-4 mr-2" />Payment Summary</h4>
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
                                            <h4 className="font-medium mb-2 flex items-center"><DollarSign className="h-4 w-4 mr-2" />Bulk Payment</h4>
                                            <p className="text-sm text-muted-foreground mb-3">Make a payment without selecting specific months. The system will automatically distribute the payment to oldest unpaid months first.</p>
                                            {unpaidMonthsForDistribution.length === 0 ? (
                                                <div className="rounded-md border p-3 bg-green-50 text-green-800 flex items-center"><Check className="mr-2 h-4 w-4" /><span>All months for this school year have been fully paid.</span></div>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between items-center text-sm font-medium py-2 border-b"><span>Total outstanding balance:</span><span className="text-destructive font-bold">{formatCurrency(totalUnpaidAmount)}</span></div>
                                                    <div className="mt-3">
                                                        <Label htmlFor="bulkAmount">Payment Amount *</Label>
                                                        <div className="relative mt-1">
                                                            <span className="absolute left-3 top-2.5">$</span>
                                                            <Input id="bulkAmount" type="number" step="0.01" min="0.01" max={totalUnpaidAmount} value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-8" />
                                                        </div>
                                                    </div>
                                                    {/* Payment distribution preview */}
                                                    {parseFloat(amount) > 0 && (
                                                        <div className="mt-4">
                                                            <div className="flex justify-between items-center cursor-pointer" onClick={(e) => { e.preventDefault(); setBulkPreviewExpanded(!bulkPreviewExpanded); }}>
                                                                <h5 className="font-medium text-sm">Payment Distribution Preview</h5>
                                                                <Button type="button" variant="ghost" size="sm" className="h-6 px-2">{bulkPreviewExpanded ? 'Hide' : 'Show'} Details</Button>
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
                                                                                        {allocation.isPartial && (<span className="text-xs text-yellow-600">Partial</span>)}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </>
                                                                    ) : (<div className="text-center py-2 text-muted-foreground">Enter a payment amount to see distribution</div>)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {parseFloat(amount) > 0 && parseFloat(amount) < totalUnpaidAmount && (
                                            <div className="rounded-md border p-3 bg-yellow-50 text-yellow-700 flex items-center text-sm"><AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" /><span>This amount will partially pay some months. The oldest unpaid months will be prioritized.</span></div>
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
                            <Label htmlFor="partial">Partial payment (Tuition)</Label>
                        </div>
                    )}

                    {/* Payment Amount */}
                    <div className="space-y-3">
                        <Label htmlFor="amount">Amount *</Label>
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
                                disabled={
                                    (isTuitionMode && paymentMode === 'specific' && !isPartial && (availablePaymentMonths.length === 0 || selectedMonths.length === 0)) ||
                                    (isTuitionMode && paymentMode === 'bulk' && unpaidMonthsForDistribution.length === 0)
                                }
                                required
                            />
                        </div>
                        {isTuitionMode && (
                            <div className="text-sm text-muted-foreground">
                                {paymentMode === 'bulk'
                                    ? `Maximum payment: ${formatCurrency(totalUnpaidAmount)}`
                                    : (isPartial
                                        ? "Enter the partial amount being paid for the selected month(s)."
                                        : `Full payment amount for selected month(s): ${formatCurrency(selectedMonths.length * monthlyFee)}`)
                                }
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any additional information about this payment" />
                    </div>

                    {/* Receipt Preview */}
                    <div className="rounded-md border p-4">
                        <h3 className="font-semibold">Receipt Preview</h3>
                        <div className="mt-2 space-y-1 text-sm">
                            <div className="grid grid-cols-2"><span className="text-muted-foreground">Student:</span><span>{student.name}</span></div>
                            <div className="grid grid-cols-2"><span className="text-muted-foreground">Date:</span><span>{new Date().toLocaleDateString()}</span></div>
                            <div className="grid grid-cols-2"><span className="text-muted-foreground">Amount:</span><span>{formatCurrency(parseFloat(amount) || 0)}</span></div>
                            <div className="grid grid-cols-2">
                                <span className="text-muted-foreground">Concept:</span>
                                <span>
                                    {paymentType === PaymentType.TUITION
                                        ? (selectedMonthsData.length
                                            ? (selectedMonthsData.length > 1 ? `Tuition - Multiple months (${selectedMonthsData.length})` : `Tuition - ${formatMonthYear(selectedMonthsData[0])}`)
                                            : (paymentMode === 'bulk' ? 'Tuition - Bulk Payment' : 'Tuition'))
                                        : (paymentType === PaymentType.INSCRIPTION ? 'Inscription Fee' : (description || 'Optional Payment'))
                                    }
                                </span>
                            </div>
                            <div className="grid grid-cols-2"><span className="text-muted-foreground">Payment Method:</span><span>{paymentMethodDisplayMap[paymentMethod] || paymentMethod}</span></div>
                            <div className="grid grid-cols-2"><span className="text-muted-foreground">Processed by:</span><span>{clerkName}</span></div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
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
                        {isSubmitting ? 'Processing...' : `Record ${paymentTypeOptions[paymentType].label}`}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
