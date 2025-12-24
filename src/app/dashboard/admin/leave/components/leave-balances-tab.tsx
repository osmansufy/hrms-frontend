"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    useAdminLeaveBalances,
    useExportBalances,
    useAdjustBalance,
    downloadCSV,
} from "@/lib/queries/leave";
import {
    Search,
    Download,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Edit,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

const adjustSchema = z.object({
    adjustment: z.string().min(1, "Adjustment is required").refine(
        (val) => !isNaN(parseFloat(val)),
        "Adjustment must be a valid number"
    ),
    reason: z.string().min(10, "Reason must be at least 10 characters long for audit purposes"),
});

type AdjustFormValues = z.infer<typeof adjustSchema>;

export function LeaveBalancesTab() {
    const currentYear = new Date().getFullYear();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<"low" | "normal" | "negative" | "">("");
    const [year, setYear] = useState(currentYear);
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
    const [selectedBalance, setSelectedBalance] = useState<{
        userId: string;
        leaveTypeId: string;
        employeeName: string;
        leaveTypeName: string;
        currentBalance: number;
    } | null>(null);

    const { data, isLoading, error } = useAdminLeaveBalances({
        page,
        pageSize,
        search: search || undefined,
        status: status || undefined,
        year,
    });

    const exportMutation = useExportBalances();
    const adjustMutation = useAdjustBalance();

    const adjustForm = useForm<AdjustFormValues>({
        resolver: zodResolver(adjustSchema),
        defaultValues: {
            adjustment: "",
            reason: "",
        },
    });

    const handleExport = async () => {
        try {
            toast.info("Preparing export...");
            const blob = await exportMutation.mutateAsync({
                year,
            });
            downloadCSV(blob, `leave_balances_${year}.csv`);
            toast.success("Export downloaded successfully");
        } catch (error) {
            toast.error("Failed to export balances");
            console.error(error);
        }
    };

    const handleOpenAdjustDialog = (balance: any) => {
        setSelectedBalance({
            userId: balance.userId,
            leaveTypeId: balance.leaveType.id,
            employeeName: balance.employee.name,
            leaveTypeName: balance.leaveType.name,
            currentBalance: balance.balances.available,
        });
        adjustForm.reset();
        setAdjustDialogOpen(true);
    };

    const handleAdjustBalance = async (values: AdjustFormValues) => {
        if (!selectedBalance) return;

        try {
            await adjustMutation.mutateAsync({
                userId: selectedBalance.userId,
                leaveTypeId: selectedBalance.leaveTypeId,
                adjustment: parseFloat(values.adjustment),
                reason: values.reason,
            });
            toast.success("Balance adjusted successfully");
            setAdjustDialogOpen(false);
            setSelectedBalance(null);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to adjust balance");
        }
    };

    if (isLoading) {
        return <BalancesSkeleton />;
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Error Loading Balances
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Failed to load leave balances. Please try again later.
                    </p>
                </CardContent>
            </Card>
        );
    }



    return (
        <div className="space-y-4">
            {/* Filters and Actions */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="pl-8"
                                />
                            </div>

                            {/* Status Filter */}
                            <Select
                                value={status || "all"}
                                onValueChange={(value) => {
                                    setStatus(value === "all" ? "" : (value as typeof status));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="negative">Negative</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Year Filter */}
                            <Select
                                value={year.toString()}
                                onValueChange={(value) => {
                                    setYear(parseInt(value));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                                        <SelectItem key={y} value={y.toString()}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Export Button */}
                            <Button
                                onClick={handleExport}
                                disabled={exportMutation.isPending || !data || data.data.length === 0}
                                variant="outline"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {exportMutation.isPending ? "Exporting..." : "Export CSV"}
                            </Button>
                        </div>

                        {/* Statistics */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                                <strong>{data?.statistics.totalEmployees}</strong> employees
                            </span>
                            <span>•</span>
                            <span>
                                <strong>{data?.statistics.negativeBalances}</strong> negative balances
                            </span>
                            <span>•</span>
                            <span>
                                <strong>{data?.statistics.lowBalances}</strong> low balances
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Balances Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Leave Type</TableHead>
                                    <TableHead className="text-right">Available</TableHead>
                                    <TableHead className="text-right">Used</TableHead>
                                    <TableHead className="text-right">Total Allocated</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            {
                                !data || data.data.length === 0 ? (
                                    <TableBody>
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                No leave balances found.
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                ) : (
                                    <TableBody>
                                        {data.data.map((balance) => (
                                            <TableRow key={balance.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {balance.employee.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {balance.employee.email}
                                                        </span>
                                                        {(
                                                            balance.employee.personalEmail &&
                                                            balance.employee.personalEmail !== balance.employee.email
                                                        ) ? (
                                                            <span className="text-xs text-muted-foreground">
                                                                {balance.employee.personalEmail}
                                                            </span>
                                                        ) : null}
                                                        <span className="text-xs text-muted-foreground">
                                                            {balance.employee.department?.name || "N/A"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {balance.employee.employeeCode}
                                                </TableCell>
                                                <TableCell>{balance.leaveType.name}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-semibold text-base">
                                                        {balance.balances.available}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {balance.balances.used}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {balance.balances.openingBalance +
                                                        balance.balances.accrued +
                                                        balance.balances.carried +
                                                        balance.balances.adjusted}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant={
                                                            balance.status === "NEGATIVE"
                                                                ? "destructive"
                                                                : balance.status === "LOW"
                                                                    ? "secondary"
                                                                    : "default"
                                                        }
                                                        className={
                                                            balance.status === "LOW"
                                                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                                                : balance.status === "NORMAL"
                                                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                                    : ""
                                                        }
                                                    >
                                                        {balance.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleOpenAdjustDialog(balance)}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Adjust
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                )}

                        </Table>
                    </div>

                    {/* Pagination */}
                    {
                        data && data.pagination.totalPages > 1 && (<div className="flex items-center justify-between border-t px-6 py-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {(page - 1) * pageSize + 1} to{" "}
                                {Math.min(page * pageSize, data.pagination.totalCount)} of{" "}
                                {data.pagination.totalCount} results
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <div className="text-sm">
                                    Page {page} of {data.pagination.totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page >= data.pagination.totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                        )
                    }
                </CardContent>
            </Card>

            {/* Adjust Balance Dialog */}
            <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Leave Balance</DialogTitle>
                        <DialogDescription>
                            {selectedBalance && (
                                <>
                                    Adjusting balance for <strong>{selectedBalance.employeeName}</strong>{" "}
                                    - {selectedBalance.leaveTypeName}
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedBalance && (
                        <div className="rounded-md bg-muted p-3 text-sm">
                            Current balance:{" "}
                            <strong>{selectedBalance.currentBalance} days</strong>
                        </div>
                    )}
                    <Form {...adjustForm}>
                        <form
                            onSubmit={adjustForm.handleSubmit(handleAdjustBalance)}
                            className="space-y-4"
                        >
                            <FormField
                                control={adjustForm.control}
                                name="adjustment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adjustment (days)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                placeholder="e.g., 5 or -3"
                                                aria-label="Leave balance adjustment in days"
                                                {...field}
                                            />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            Positive numbers add to balance, negative numbers subtract
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={adjustForm.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Explain why this adjustment is being made (minimum 10 characters)..."
                                                aria-label="Reason for balance adjustment"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setAdjustDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={adjustMutation.isPending}>
                                    {adjustMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Adjusting...
                                        </>
                                    ) : (
                                        "Adjust Balance"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function BalancesSkeleton() {
    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
