// src/components/students/balance-adjustement.tsx
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
import { PlusCircle, MinusCircle, RefreshCw } from 'lucide-react'

interface BalanceAdjustmentProps {
    studentId: string
    studentName: string
    currentBalance: number
    expectedBalance?: number  // Added prop for expected balance
    onSyncBalance?: () => void  // Optional callback for syncing
}

type AdjustmentType = 'increase' | 'decrease'

export default function BalanceAdjustment({
    studentId,
    studentName,
    currentBalance,
    expectedBalance,
    onSyncBalance
}: BalanceAdjustmentProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)
    const [amount, setAmount] = useState('')
    const [reason, setReason] = useState('')
    const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('increase')

    const router = useRouter()
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!amount || parseFloat(amount) <= 0) {
            toast({
                title: 'Monto Inválido',
                description: 'Por favor, ingrese un monto válido mayor que cero.',
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
                throw new Error(error.error || 'Error al actualizar el saldo')
            }

            toast({
                title: 'Saldo Actualizado',
                description: `El saldo de ${studentName} ha sido ${adjustmentType === 'increase' ? 'aumentado' : 'disminuido'} en ${formatCurrency(adjustmentAmount)}.`,
            })

            // Close dialog and refresh page
            setOpen(false)
            setAmount('')
            setReason('')
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

    // New function to handle syncing balance to expected amount
    const handleSyncToExpected = async () => {
        if (!expectedBalance || expectedBalance <= currentBalance) return;

        setIsSyncing(true);

        try {
            // Call the sync balance API endpoint
            const response = await fetch(`/api/students/${studentId}/sync-balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al sincronizar el saldo');
            }

            toast({
                title: 'Saldo Sincronizado',
                description: `El saldo de ${studentName} ha sido actualizado para coincidir con el monto esperado.`,
            });

            // Call the provided callback if it exists
            if (onSyncBalance) {
                onSyncBalance();
            }

            // Close dialog and refresh
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'An error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Ajustar Saldo</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Ajustar Saldo del Estudiante</DialogTitle>
                        <DialogDescription>
                            Saldo actual: {formatCurrency(currentBalance)}
                            {expectedBalance && expectedBalance > currentBalance && (
                                <div className="mt-1 text-yellow-600">
                                    Saldo esperado: {formatCurrency(expectedBalance)}
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Add sync option when expected balance is higher */}
                        {expectedBalance && expectedBalance > currentBalance && (
                            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-sm text-yellow-800">Saldo Esperado Mayor</h4>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            Según el calendario del año escolar, este estudiante debería tener un saldo de {formatCurrency(expectedBalance)}.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                                        onClick={handleSyncToExpected}
                                        disabled={isSyncing}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        {isSyncing ? 'Sincronizando...' : 'Sincronizar Saldo'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="adjustment-type">Tipo de Ajuste</Label>
                            <Select
                                value={adjustmentType}
                                onValueChange={(value) => setAdjustmentType(value as AdjustmentType)}
                                required
                            >
                                <SelectTrigger id="adjustment-type">
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="increase">
                                        <div className="flex items-center">
                                            <PlusCircle className="h-4 w-4 mr-2 text-destructive" />
                                            <span>Aumentar Saldo (Agregar Cargo)</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="decrease">
                                        <div className="flex items-center">
                                            <MinusCircle className="h-4 w-4 mr-2 text-green-600" />
                                            <span>Disminuir Saldo (Crédito)</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="amount">Monto</Label>
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
                            <Label htmlFor="reason">Motivo (opcional)</Label>
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Motivo del ajuste de saldo"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting || isSyncing}
                            className="mr-auto"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || isSyncing}
                            variant={adjustmentType === 'increase' ? 'destructive' : 'default'}
                        >
                            {isSubmitting ? 'Actualizando...' : 'Actualizar Saldo'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
