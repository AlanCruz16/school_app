'use client';

import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { AlertCircle, Loader2, CalendarDays, Banknote } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Payment, PaymentMethod, Student } from '@prisma/client';

// Define the shape of the payment data including student
type PaymentWithStudent = Payment & {
    student: Pick<Student, 'id' | 'name'> | null;
};

// Define the shape of the data expected from the API when fetching payments for a month
type PaymentsByMonthReportData = {
    [key in PaymentMethod]?: PaymentWithStudent[];
};

// Helper function to format PaymentMethod names (e.g., TARJETA_CREDITO -> Tarjeta Credito)
function formatPaymentMethodName(method: string) {
    return method
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Helper function to format month string (e.g., 2025-04 -> Abril 2025)
function formatMonthYear(monthStr: string) {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
}


export default function PaymentsByMonthReportPage() {
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [reportData, setReportData] = useState<PaymentsByMonthReportData>({});
    const [loadingMonths, setLoadingMonths] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch available months on initial load
    useEffect(() => {
        async function fetchMonths() {
            setLoadingMonths(true);
            setError(null);
            try {
                const response = await fetch('/api/reports/payments-by-month');
                if (!response.ok) {
                    throw new Error(`Failed to fetch available months: ${response.statusText}`);
                }
                const result: string[] = await response.json();
                setAvailableMonths(result);
                // Optionally select the latest month by default
                // if (result.length > 0) {
                //     setSelectedMonth(result[0]);
                // }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred fetching months');
                console.error(err);
            } finally {
                setLoadingMonths(false);
            }
        }
        fetchMonths();
    }, []);

    // Fetch report data when selectedMonth changes
    useEffect(() => {
        if (!selectedMonth) {
            setReportData({}); // Clear data if no month is selected
            return;
        }

        async function fetchReportData() {
            setLoadingReport(true);
            setError(null);
            try {
                const response = await fetch(`/api/reports/payments-by-month?month=${selectedMonth}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch report data: ${response.statusText}`);
                }
                const result: PaymentsByMonthReportData = await response.json();
                setReportData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred fetching report data');
                console.error(err);
                setReportData({}); // Clear data on error
            } finally {
                setLoadingReport(false);
            }
        }
        fetchReportData();
    }, [selectedMonth]);

    const noReportDataFound = !loadingReport && !error && selectedMonth && Object.keys(reportData).length === 0;

    return (
        <div className="container mx-auto p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CalendarDays className="h-6 w-6" />
                Reporte de Pagos por Mes y Método
            </h1>

            {/* Month Selector */}
            <div className="mb-6 max-w-xs">
                <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar Mes
                </label>
                {loadingMonths ? (
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cargando meses...
                    </div>
                ) : availableMonths.length > 0 ? (
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger id="month-select">
                            <SelectValue placeholder="Seleccione un mes..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableMonths.map((month) => (
                                <SelectItem key={month} value={month}>
                                    {formatMonthYear(month)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <p className="text-sm text-muted-foreground">No hay meses con pagos registrados.</p>
                )}
            </div>

            {/* Loading/Error/No Data States */}
            {loadingReport && (
                <Card>
                    <CardContent className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Cargando datos del reporte para {formatMonthYear(selectedMonth)}...</span>
                    </CardContent>
                </Card>
            )}
            {error && (
                <Card className="border-destructive">
                    <CardContent className="flex justify-center items-center py-10 text-destructive">
                        <AlertCircle className="h-8 w-8 mr-2" />
                        <span>Error al cargar el reporte: {error}</span>
                    </CardContent>
                </Card>
            )}
            {noReportDataFound && (
                <Card>
                    <CardContent>
                        <p className="text-center text-muted-foreground py-10">No se encontraron datos de pago para {formatMonthYear(selectedMonth)}.</p>
                    </CardContent>
                </Card>
            )}

            {/* Report Data Display */}
            {!loadingReport && !error && selectedMonth && Object.keys(reportData).length > 0 && (
                <div className="space-y-6">
                    {(Object.keys(reportData) as PaymentMethod[]).map((method) => (
                        <Card key={method}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Banknote className="h-5 w-5 text-muted-foreground" />
                                    {formatPaymentMethodName(method)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Estudiante</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                            <TableHead>Fecha de Pago</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead>Recibo #</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportData[method]?.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{payment.student?.name ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(parseFloat(payment.amount as any))}</TableCell>
                                                <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                                                <TableCell>{payment.description ?? '-'}</TableCell>
                                                <TableCell>{payment.receiptNumber}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
