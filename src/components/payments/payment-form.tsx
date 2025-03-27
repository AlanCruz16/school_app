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
    const [paymentMethod, setPaymentMethod] = useState('CASH')
    const [selectedMonths, setSelectedMonths] = useState<string[]>([])
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
                label,
                fee: monthlyFee
            };
        });
    }, [activeSchoolYear, payments, monthlyFee]);

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

    // Generate receipt number
    const generateReceiptNumber = () => {
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        return `R${year}${month}${day}-${random}`
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (selectedMonths.length === 0 || !amount) {
            toast({
                title: 'Validation Error',
                description: 'Please select at least one month and provide a payment amount.',
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

        // For non-partial payments, ensure amount matches expected total
        const expectedTotal = selectedMonths.length * monthlyFee;
        if (!isPartial && paymentAmount !== expectedTotal) {
            setIsPartial(true)
        }

        setIsSubmitting(true)

        try {
            // Create an array of month data for the API request
            const monthsData = selectedMonthsData.map(month => ({
                month: month.month,
                year: month.year,
                fee: month.fee
            }));

            // Generate a single receipt number for all payments
            const receiptNumber = generateReceiptNumber();

            const paymentData = {
                studentId: student.id,
                amount: paymentAmount,
                paymentMethod,
                months: monthsData,
                schoolYearId: activeSchoolYear.id,
                clerkId,
                receiptNumber,
                isPartial: isPartial || paymentAmount < expectedTotal,
                notes: notes || null,
                // Add these fields to satisfy single-month validation
                forMonth: selectedMonthsData.length > 0 ? selectedMonthsData[0].month : null,
                forYear: selectedMonthsData.length > 0 ? selectedMonthsData[0].year : null
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

                    {/* Month Selection */}
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

                    {/* Selected Month Summary */}
                    {selectedMonths.length > 0 && (
                        <div className="rounded-md border p-4 bg-secondary/20">
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
                                max={isPartial ? undefined : selectedMonths.length * monthlyFee}
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
                                `Full payment amount: ${formatCurrency(selectedMonths.length * monthlyFee)}`
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
                        disabled={isSubmitting || selectedMonths.length === 0}
                    >
                        {isSubmitting ? 'Processing...' : 'Record Payment'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}