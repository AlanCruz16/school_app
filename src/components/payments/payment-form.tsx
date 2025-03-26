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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
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
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatMonth } from '@/lib/utils/format'
import { getAllSchoolYearMonths, formatMonthYear } from '@/lib/utils/balance'
import { Check, AlertCircle } from 'lucide-react'

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
    paymentMethod: string
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
    const [paymentMethod, setPaymentMethod] = useState('CASH')
    const [month, setMonth] = useState('')
    const [year, setYear] = useState(initialYear ? initialYear.toString() : new Date().getFullYear().toString())
    const [isPartial, setIsPartial] = useState(false)
    const [amount, setAmount] = useState(monthlyFee.toString())
    const [notes, setNotes] = useState('')
    const [payments, setPayments] = useState<Payment[]>(studentPayments || [])

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
                label
            };
        });
    }, [activeSchoolYear, payments, monthlyFee]);

    // Get unpaid and partially paid months
    const availablePaymentMonths = useMemo(() => {
        // For now, filter out fully paid months
        return availableMonths.filter(m => m.status !== 'paid');
    }, [availableMonths]);

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

    // Set initial month/year if provided and available
    useEffect(() => {
        if (initialMonth && initialYear && !isLoading && availablePaymentMonths.length > 0) {
            const initialMonthKey = `${initialYear}-${initialMonth.toString().padStart(2, '0')}`;
            const monthExists = availablePaymentMonths.some(m => m.key === initialMonthKey);

            if (monthExists) {
                setMonth(initialMonthKey);
                setYear(initialYear.toString());
            } else {
                // Select first available month if initial is not available
                setMonth(availablePaymentMonths[0].key);
                setYear(availablePaymentMonths[0].year.toString());
            }
        } else if (!isLoading && availablePaymentMonths.length > 0 && !month) {
            // Select first available month by default
            setMonth(availablePaymentMonths[0].key);
            setYear(availablePaymentMonths[0].year.toString());
        }
    }, [isLoading, availablePaymentMonths, initialMonth, initialYear]); // Removed month from dependencies to avoid loop

    // Update amount when monthly fee or partial status changes
    useEffect(() => {
        if (!isPartial) {
            setAmount(monthlyFee.toString())
        }
    }, [isPartial, monthlyFee])

    // Generate receipt number
    const generateReceiptNumber = () => {
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        return `R${year}${month}${day}-${random}`
    }

    // Find selected month details
    const selectedMonthData = useMemo(() => {
        return availableMonths.find(m => m.key === month);
    }, [month, availableMonths]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!month || !amount || !year) {
            toast({
                title: 'Validation Error',
                description: 'Please fill out all required fields.',
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

        // For non-partial payments, ensure amount matches fee
        if (!isPartial && paymentAmount !== monthlyFee) {
            setIsPartial(true)
        }

        setIsSubmitting(true)

        try {
            // Extract month and year from selected key
            const selectedMonth = selectedMonthData?.month;
            const selectedYear = selectedMonthData?.year;

            if (!selectedMonth || !selectedYear) {
                throw new Error('Invalid month selection');
            }

            const paymentData = {
                studentId: student.id,
                amount: paymentAmount,
                paymentMethod,
                forMonth: selectedMonth,
                forYear: selectedYear,
                schoolYearId: activeSchoolYear.id,
                clerkId,
                receiptNumber: generateReceiptNumber(),
                isPartial: isPartial || paymentAmount < monthlyFee,
                notes: notes || null,
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

            // Redirect to payment receipt or student detail
            router.push(`/payments/${result.id}/receipt`)
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

                    {/* Payment Method */}
                    <div className="space-y-3">
                        <Label>Payment Method</Label>
                        <RadioGroup
                            value={paymentMethod}
                            onValueChange={setPaymentMethod}
                            className="flex space-x-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="CASH" id="cash" />
                                <Label htmlFor="cash">Cash</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="CARD" id="card" />
                                <Label htmlFor="card">Card</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Month and Year Selection */}
                    <div className="space-y-3">
                        <Label htmlFor="month">Month *</Label>
                        {isLoading ? (
                            <div className="h-9 w-full rounded-md border bg-muted animate-pulse" />
                        ) : availablePaymentMonths.length > 0 ? (
                            <Select
                                value={month}
                                onValueChange={setMonth}
                                required
                            >
                                <SelectTrigger id="month">
                                    <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availablePaymentMonths.map((monthData) => (
                                        <SelectItem
                                            key={monthData.key}
                                            value={monthData.key}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                {monthData.status === 'partial' && (
                                                    <Badge variant="secondary" className="mr-2">Partial</Badge>
                                                )}
                                                {monthData.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="rounded-md border p-3 bg-green-50 text-green-800 flex items-center">
                                <Check className="mr-2 h-4 w-4" />
                                <span>All months for this school year have been fully paid.</span>
                            </div>
                        )}
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
                                max={isPartial ? undefined : monthlyFee}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-8"
                                disabled={!isPartial && availablePaymentMonths.length === 0}
                                required
                            />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {isPartial ?
                                "Enter the partial amount being paid." :
                                `Full payment amount: ${formatCurrency(monthlyFee)}`
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
                                    {selectedMonthData ? formatMonthYear(selectedMonthData) : "--"}
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-muted-foreground">Payment Method:</span>
                                <span>{paymentMethod === 'CASH' ? 'Cash' : 'Card'}</span>
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
                        disabled={isSubmitting || availablePaymentMonths.length === 0}
                    >
                        {isSubmitting ? 'Processing...' : 'Record Payment'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}