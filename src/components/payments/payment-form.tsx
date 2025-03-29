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
// Keep RadioGroup import in case it's used elsewhere or for future reference
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select' // Import Select components
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
import { CreditCard, DollarSign } from 'lucide-react'

// Define the PaymentMethod enum type based on Prisma schema
import { PaymentMethod as PrismaPaymentMethod } from '@prisma/client';

// Define the mapping for the options available in the dropdown
const paymentMethodOptions = {
    [PrismaPaymentMethod.EFECTIVO]: '01 Efectivo',
    [PrismaPaymentMethod.CHEQUE_NOMINATIVO]: '02 Cheque nominativo',
    [PrismaPaymentMethod.TRANSFERENCIA]: '03 Transferencia electrónica de fondos',
    [PrismaPaymentMethod.TARJETA_CREDITO]: '04 Tarjeta de crédito',
    [PrismaPaymentMethod.TARJETA_DEBITO]: '28 Tarjeta de débito',
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
    forMonth: number
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

    // Form state - Use PrismaPaymentMethod enum type and default to EFECTIVO
    const [paymentMethod, setPaymentMethod] = useState<PrismaPaymentMethod>(PrismaPaymentMethod.EFECTIVO)
    const [selectedMonths, setSelectedMonths] = useState<string[]>([])
    const [isPartial, setIsPartial] = useState(false)
    const [amount, setAmount] = useState(monthlyFee.toString())
    const [notes, setNotes] = useState('')
    const [payments, setPayments] = useState<Payment[]>(studentPayments || [])
    const [paymentMode, setPaymentMode] = useState<'specific' | 'bulk'>('specific')
    const [bulkPreviewExpanded, setBulkPreviewExpanded] = useState(false)

    // Initialize payments from studentPayments on first render only
    useEffect(() => {
        if (studentPayments && studentPayments.length > 0) {
            setPayments(studentPayments);
        }
    }, []) // Empty dependency array ensures this only runs once

    // Compute available months based on school year and payment history
    const availableMonths = useMemo(() => {
        // Get all months in the school year
        const allMonths = getAllSchoolYearMonths(activeSchoolYear);

        // Check payment status for each month
        return allMonths.map(monthYear => {
            // Find payments for this specific month/year
            const monthPayments = payments.filter(payment => {
                // Check if payment matches this month/year
                if (payment.forYear) {
                    return payment.forMonth === monthYear.month &&
                        payment.forYear === monthYear.year &&
                        payment.schoolYearId === activeSchoolYear.id;
                } else {
                    // For backward compatibility
                    return payment.forMonth === monthYear.month &&
                        payment.schoolYearId === activeSchoolYear.id;
                }
            });

            // Calculate total paid for this month
            const totalPaid = monthPayments.reduce((sum, payment) => {
                const amount = typeof payment.amount === 'object'
                    ? parseFloat(payment.amount.toString())
                    : typeof payment.amount === 'string'
                        ? parseFloat(payment.amount)
                        : payment.amount;
                return sum + amount;
            }, 0);

            // Determine payment status
            let status: MonthStatus = 'unpaid';
            if (totalPaid >= monthlyFee) {
                status = 'paid';
            } else if (totalPaid > 0) {
                status = 'partial';
            }

            // Create label with status indicator
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
    }, [activeSchoolYear, payments, monthlyFee]);

    // Calculate bulk payment distribution
    const unpaidMonthsForDistribution = availableMonths
        .filter(month => month.status !== 'paid')
        .map(month => {
            // Find any payments for this month (to calculate already paid amount)
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

            // Calculate amount already paid for this month
            const paidAmount = monthPayments.reduce((sum, payment) => {
                const amount = typeof payment.amount === 'object'
                    ? parseFloat(payment.amount.toString())
                    : typeof payment.amount === 'string'
                        ? parseFloat(payment.amount)
                        : payment.amount;
                return sum + amount;
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

    // Calculate total unpaid amount
    const totalUnpaidAmount = unpaidMonthsForDistribution.reduce(
        (sum, month) => sum + (month.expectedAmount - (month.paidAmount || 0)),
        0
    );

    // Calculate distribution based on current payment amount
    const paymentDistribution = useMemo(() => {
        const paymentVal = parseFloat(amount) || 0;
        if (paymentVal <= 0) return [];

        return distributePayment(paymentVal, unpaidMonthsForDistribution);
    }, [amount, unpaidMonthsForDistribution]);

    // Get unpaid and partially paid months
    const availablePaymentMonths = useMemo(() => {
        // Filter out fully paid months
        return availableMonths.filter(m => m.status !== 'paid');
    }, [availableMonths]);

    // Calculate total amount based on selected months
    const calculateTotalAmount = () => {
        if (isPartial) {
            // For partial payments, user enters specific amount
            return parseFloat(amount);
        } else {
            // For full payments, multiply monthly fee by number of selected months
            return selectedMonths.length * monthlyFee;
        }
    };

    // Update amount when selection or partial status changes
    useEffect(() => {
        if (!isPartial) {
            setAmount((selectedMonths.length * monthlyFee).toString());
        }
    }, [selectedMonths, isPartial, monthlyFee]);

    // Fetch payment history only if not provided through props
    useEffect(() => {
        let isMounted = true;

        const fetchPaymentHistory = async () => {
            // Skip if we already have payment data
            if (payments.length > 0) {
                setIsLoading(false);
                return;
            }

            try {
                // Fetch student payment history for the active school year
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
                        description: 'Could not load payment history. Some paid months might still be shown.',
                        variant: 'destructive',
                    });
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchPaymentHistory();

        // Cleanup function to prevent state updates after unmounting
        return () => {
            isMounted = false;
        };
    }, [student.id, activeSchoolYear.id, toast]); // Removed payments from dependencies

    // Handle month checkbox toggle
    const toggleMonth = (monthKey: string) => {
        setSelectedMonths(prevSelected => {
            if (prevSelected.includes(monthKey)) {
                return prevSelected.filter(key => key !== monthKey);
            } else {
                return [...prevSelected, monthKey];
            }
        });
    };

    // Get selected month details
    const selectedMonthsData = useMemo(() => {
        return availableMonths
            .filter(month => selectedMonths.includes(month.key))
            .sort((a, b) => {
                // Sort by year then month
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });
    }, [selectedMonths, availableMonths]);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate based on payment mode
        if (paymentMode === 'specific' && selectedMonths.length === 0) {
            toast({
                title: 'Validation Error',
                description: 'Please select at least one month for payment.',
                variant: 'destructive',
            })
            return
        }

        if (!amount) {
            toast({
                title: 'Validation Error',
                description: 'Please enter a payment amount.',
                variant: 'destructive',
            })
            return
        }

        // Check amount is valid
        const paymentAmount = parseFloat(amount)
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            toast({
                title: 'Validation Error',
                description: 'Please enter a valid payment amount.',
                variant: 'destructive',
            })
            return
        }

        // For non-partial payments in specific mode, ensure amount matches expected total
        if (paymentMode === 'specific' && !isPartial) {
            const expectedTotal = selectedMonths.length * monthlyFee;
            if (paymentAmount !== expectedTotal) {
                setIsPartial(true)
            }
        }

        setIsSubmitting(true)

        try {


            let paymentData;

            if (paymentMode === 'specific') {
                // Specific month payment mode - similar to existing code
                const monthsData = selectedMonthsData.map(month => ({
                    month: month.month,
                    year: month.year,
                    fee: month.fee
                }));

                paymentData = {
                    studentId: student.id,
                    amount: paymentAmount,
                    paymentMethod, // Pass the enum value directly
                    months: monthsData,
                    schoolYearId: activeSchoolYear.id,
                    clerkId,
                    isPartial: isPartial || paymentAmount < (selectedMonths.length * monthlyFee),
                    notes: notes || null,
                    // Add these fields to satisfy single-month validation
                    forMonth: selectedMonthsData.length > 0 ? selectedMonthsData[0].month : null,
                    forYear: selectedMonthsData.length > 0 ? selectedMonthsData[0].year : null
                }
            } else {
                // Bulk payment mode - use distribution calculation
                const monthsData = paymentDistribution.map(allocation => ({
                    month: allocation.monthYear.month,
                    year: allocation.monthYear.year,
                    fee: monthlyFee,
                    // Include allocation amount to ensure API knows how to distribute
                    allocation: allocation.amount
                }));

                paymentData = {
                    studentId: student.id,
                    amount: paymentAmount,
                    paymentMethod, // Pass the enum value directly
                    months: monthsData,
                    schoolYearId: activeSchoolYear.id,
                    clerkId,
                    isPartial: paymentAmount < totalUnpaidAmount,
                    notes: notes || null,
                    // Flag to indicate bulk payment mode
                    isBulkPayment: true
                }
            }

            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Something went wrong')
            }

            const result = await response.json()

            toast({
                title: 'Payment Recorded',
                description: `Payment of ${formatCurrency(paymentAmount)} for ${student.name} has been recorded successfully.`,
            })

            // Redirect to payment receipt
            router.push(`/payments/${result.payment.id}/receipt`)
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

    if (!student.grade) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Missing Grade Information</CardTitle>
                    <CardDescription>
                        This student doesn't have a valid grade assignment.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        Before recording payments, this student needs to be assigned to a grade with a valid tuition amount.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Go Back
                    </Button>
                    <Button asChild>
                        <Link href={`/students/${student.id}/edit`}>
                            Edit Student
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>New Payment</CardTitle>
                    <CardDescription>
                        Record a payment for {student.name}
                    </CardDescription>
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
                                <div>
                                    {student.grade?.name} ({student.grade?.schoolYear?.name || "No school year"})
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium">Monthly Fee</div>
                                <div className="font-bold">
                                    {formatCurrency(monthlyFee)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method - Replaced with Select */}
                    <div className="space-y-3">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select
                            value={paymentMethod}
                            onValueChange={(value) => setPaymentMethod(value as PrismaPaymentMethod)}
                        >
                            <SelectTrigger id="paymentMethod">
                                <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(paymentMethodOptions).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>
                                        {value}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Payment Mode Selection */}
                    <div className="space-y-3">
                        <Label>Payment Mode</Label>
                        <Tabs
                            value={paymentMode}
                            onValueChange={(value) => setPaymentMode(value as 'specific' | 'bulk')}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="specific" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Specific Months</span>
                                </TabsTrigger>
                                <TabsTrigger value="bulk" className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    <span>Bulk Payment</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="specific" className="mt-4">
                                {/* Month Selection - existing UI */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Select Months to Pay *</Label>
                                        <div className="text-xs text-muted-foreground">
                                            {selectedMonths.length} month{selectedMonths.length !== 1 ? 's' : ''} selected
                                        </div>
                                    </div>

                                    {isLoading ? (
                                        <div className="h-[200px] w-full rounded-md border bg-muted animate-pulse" />
                                    ) : availablePaymentMonths.length > 0 ? (
                                        <div className="max-h-[300px] overflow-y-auto rounded-md border p-4">
                                            <div className="space-y-2">
                                                {availablePaymentMonths.map((monthData) => (
                                                    <div key={monthData.key} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`month-${monthData.key}`}
                                                            checked={selectedMonths.includes(monthData.key)}
                                                            onCheckedChange={() => toggleMonth(monthData.key)}
                                                        />
                                                        <Label
                                                            htmlFor={`month-${monthData.key}`}
                                                            className="flex items-center cursor-pointer"
                                                        >
                                                            <span className="flex-1">
                                                                {formatMonth(monthData.month)} {monthData.year}
                                                            </span>
                                                            {monthData.status === 'partial' && (
                                                                <Badge variant="secondary" className="ml-2">Partial</Badge>
                                                            )}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border p-3 bg-green-50 text-green-800 flex items-center">
                                            <Check className="mr-2 h-4 w-4" />
                                            <span>All months for this school year have been fully paid.</span>
                                        </div>
                                    )}
                                </div>

                                {/* Selected Month Summary - existing code */}
                                {selectedMonths.length > 0 && (
                                    <div className="rounded-md border p-4 bg-secondary/20 mt-4">
                                        <h4 className="font-medium text-sm mb-2 flex items-center">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Payment Summary
                                        </h4>
                                        <div className="space-y-1 text-sm">
                                            {selectedMonthsData.map(month => (
                                                <div key={month.key} className="flex justify-between">
                                                    <span>{formatMonth(month.month)} {month.year}</span>
                                                    <span>{formatCurrency(month.fee)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between font-bold pt-2 border-t mt-2">
                                                <span>Total</span>
                                                <span>{formatCurrency(selectedMonths.length * monthlyFee)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="bulk" className="mt-4">
                                {/* Bulk Payment UI */}
                                <div className="space-y-4">
                                    <div className="rounded-md border p-4">
                                        <h4 className="font-medium mb-2 flex items-center">
                                            <DollarSign className="h-4 w-4 mr-2" />
                                            Bulk Payment
                                        </h4>

                                        <p className="text-sm text-muted-foreground mb-3">
                                            Make a payment without selecting specific months. The system will automatically distribute the payment to oldest unpaid months first.
                                        </p>

                                        {unpaidMonthsForDistribution.length === 0 ? (
                                            <div className="rounded-md border p-3 bg-green-50 text-green-800 flex items-center">
                                                <Check className="mr-2 h-4 w-4" />
                                                <span>All months for this school year have been fully paid.</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-center text-sm font-medium py-2 border-b">
                                                    <span>Total outstanding balance:</span>
                                                    <span className="text-destructive font-bold">{formatCurrency(totalUnpaidAmount)}</span>
                                                </div>

                                                <div className="mt-3">
                                                    <Label htmlFor="bulkAmount">Payment Amount *</Label>
                                                    <div className="relative mt-1">
                                                        <span className="absolute left-3 top-2.5">$</span>
                                                        <Input
                                                            id="bulkAmount"
                                                            type="number"
                                                            step="0.01"
                                                            min="0.01"
                                                            max={totalUnpaidAmount}
                                                            value={amount}
                                                            onChange={(e) => setAmount(e.target.value)}
                                                            className="pl-8"
                                                        />
                                                    </div>
                                                </div>


                                                {/* Payment distribution preview */}
                                                {parseFloat(amount) > 0 && (
                                                    <div className="mt-4">
                                                        <div
                                                            className="flex justify-between items-center cursor-pointer"
                                                            onClick={(e) => {
                                                                e.preventDefault(); // Add this line
                                                                setBulkPreviewExpanded(!bulkPreviewExpanded);
                                                            }}
                                                        >
                                                            <h5 className="font-medium text-sm">Payment Distribution Preview</h5>
                                                            <Button type="button" variant="ghost" size="sm" className="h-6 px-2">
                                                                {bulkPreviewExpanded ? 'Hide' : 'Show'} Details
                                                            </Button>
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
                                                                                    {allocation.isPartial && (
                                                                                        <span className="text-xs text-yellow-600">Partial</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </>
                                                                ) : (
                                                                    <div className="text-center py-2 text-muted-foreground">
                                                                        Enter a payment amount to see distribution
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {parseFloat(amount) > 0 && parseFloat(amount) < totalUnpaidAmount && (
                                        <div className="rounded-md border p-3 bg-yellow-50 text-yellow-700 flex items-center text-sm">
                                            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                            <span>This amount will partially pay some months. The oldest unpaid months will be prioritized.</span>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>


                    {/* Partial Payment Toggle */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="partial"
                            checked={isPartial}
                            onCheckedChange={setIsPartial}
                        />
                        <Label htmlFor="partial">Partial payment</Label>
                    </div>

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
                                max={
                                    paymentMode === 'bulk'
                                        ? (totalUnpaidAmount > 0 ? totalUnpaidAmount : undefined)
                                        : (isPartial ? undefined : selectedMonths.length * monthlyFee)
                                }
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-8"
                                disabled={
                                    (paymentMode === 'specific' && !isPartial && availablePaymentMonths.length === 0) ||
                                    (paymentMode === 'bulk' && unpaidMonthsForDistribution.length === 0)
                                }
                                required
                            />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {paymentMode === 'bulk'
                                ? `Maximum payment: ${formatCurrency(totalUnpaidAmount)}`
                                : (isPartial
                                    ? "Enter the partial amount being paid."
                                    : `Full payment amount: ${formatCurrency(selectedMonths.length * monthlyFee)}`)
                            }
                        </div>
                    </div>
                    {/* Notes */}
                    <div className="space-y-3">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any additional information about this payment"
                        />
                    </div>

                    {/* Receipt Preview */}
                    <div className="rounded-md border p-4">
                        <h3 className="font-semibold">Receipt Preview</h3>
                        <div className="mt-2 space-y-1 text-sm">
                            <div className="grid grid-cols-2">
                                <span className="text-muted-foreground">Student:</span>
                                <span>{student.name}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-muted-foreground">Date:</span>
                                <span>{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-muted-foreground">Amount:</span>
                                <span>{formatCurrency(parseFloat(amount) || 0)}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-muted-foreground">Period:</span>
                                <span>
                                    {selectedMonthsData.length ?
                                        selectedMonthsData.length > 1 ?
                                            `Multiple months (${selectedMonthsData.length})` :
                                            formatMonthYear(selectedMonthsData[0])
                                        : "--"}
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-muted-foreground">Payment Method:</span>
                                {/* Use the display map here */}
                                <span>{paymentMethodDisplayMap[paymentMethod] || paymentMethod}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-muted-foreground">Processed by:</span>
                                <span>{clerkName}</span>
                            </div>
                        </div>
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
                    <Button
                        type="submit"
                        disabled={
                            isSubmitting ||
                            (paymentMode === 'specific' && selectedMonths.length === 0) ||
                            (paymentMode === 'bulk' && (
                                parseFloat(amount) <= 0 ||
                                unpaidMonthsForDistribution.length === 0
                            ))
                        }
                    >
                        {isSubmitting ? 'Processing...' : 'Record Payment'}
                    </Button>
                </CardFooter>
            </Card>

        </form>
    )
}
