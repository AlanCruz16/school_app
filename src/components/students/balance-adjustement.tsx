'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils/format'
import { PlusCircle, MinusCircle } from 'lucide-react'

interface BalanceAdjustmentProps {
    studentId: string
    studentName: string
    currentBalance: number
}

type AdjustmentType = 'increase' | 'decrease'

export default function BalanceAdjustment({
    studentId,
    studentName,
    currentBalance
}: BalanceAdjustmentProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [amount, setAmount] = useState('')
    const [reason, setReason] = useState('')
    const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('increase')

    const router = useRouter()
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!amount || parseFloat(amount) <= 0) {
            toast({
                title: 'Invalid Amount',
                description: 'Please enter a valid amount greater than zero.',
                variant: 'destructive'
            })
            return
        }

        const adjustmentAmount = parseFloat(amount)
        const newBalance = adjustmentType === 'increase'
            ? currentBalance + adjustmentAmount
            : Math.max(currentBalance - adjustmentAmount, 0) // Don't go below zero

        setIsSubmitting(true)

        try {
            // Call API to update student balance
            const response = await fetch(`/api/students/${studentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    balance: newBalance,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update balance')
            }

            toast({
                title: 'Balance Updated',
                description: `${studentName}'s balance has been ${adjustmentType === 'increase' ? 'increased' : 'decreased'} by ${formatCurrency(adjustmentAmount)}.`,
            })

            // Close dialog and refresh page
            setOpen(false)
            setAmount('')
            setReason('')
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Adjust Balance</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Adjust Student Balance</DialogTitle>
                        <DialogDescription>
                            Current balance: {formatCurrency(currentBalance)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="adjustment-type">Adjustment Type</Label>
                            <Select
                                value={adjustmentType}
                                onValueChange={(value) => setAdjustmentType(value as AdjustmentType)}
                                required
                            >
                                <SelectTrigger id="adjustment-type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="increase">
                                        <div className="flex items-center">
                                            <PlusCircle className="h-4 w-4 mr-2 text-destructive" />
                                            <span>Increase Balance (Add Charge)</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="decrease">
                                        <div className="flex items-center">
                                            <MinusCircle className="h-4 w-4 mr-2 text-green-600" />
                                            <span>Decrease Balance (Credit)</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5">$</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-8"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="reason">Reason (optional)</Label>
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Reason for balance adjustment"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            variant={adjustmentType === 'increase' ? 'destructive' : 'default'}
                        >
                            {isSubmitting ? 'Updating...' : 'Update Balance'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}