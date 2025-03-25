// src/components/payments/payment-form.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
    initialYear?: number // Added this new prop
}

export default function PaymentForm({
    student,
    clerkId,
    clerkName,
    activeSchoolYear,
    initialMonth,
    initialYear
}: PaymentFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Check if student has valid grade information
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

    // Monthly fee based on grade
    const monthlyFee = parseFloat(student.grade?.tuitionAmount?.toString() || "0")

    // Form state
    const [paymentMethod, setPaymentMethod] = useState('CASH')
    const [month, setMonth] = useState(initialMonth ? initialMonth.toString() : '')
    const [year, setYear] = useState(initialYear ? initialYear.toString() : new Date().getFullYear().toString())
    const [isPartial, setIsPartial] = useState(false)
    const [amount, setAmount] = useState(monthlyFee.toString())
    const [notes, setNotes] = useState('')

    // Determine available years based on school year
    const getAvailableYears = () => {
        const startDate = new Date(activeSchoolYear.startDate)
        const endDate = new Date(activeSchoolYear.endDate)
        const startYear = startDate.getFullYear()
        const endYear = endDate.getFullYear()

        return Array.from(
            { length: endYear - startYear + 1 },
            (_, i) => startYear + i
        )
    }

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
            const paymentData = {
                studentId: student.id,
                amount: paymentAmount,
                paymentMethod,
                forMonth: parseInt(month),
                forYear: parseInt(year), // Include the year information
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

                    {/* Payment Month and Year */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Label htmlFor="month">Month *</Label>
                            <Select
                                value={month}
                                onValueChange={setMonth}
                                required
                            >
                                <SelectTrigger id="month">
                                    <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                        <SelectItem key={m} value={m.toString()}>
                                            {formatMonth(m)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="year">Year *</Label>
                            <Select
                                value={year}
                                onValueChange={setYear}
                                required
                            >
                                <SelectTrigger id="year">
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getAvailableYears().map((y) => (
                                        <SelectItem key={y} value={y.toString()}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
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
                                disabled={!isPartial}
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
                                <span>{month ? `${formatMonth(parseInt(month))} ${year}` : "--"}</span>
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
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Record Payment'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}