"use client";

import { useState } from "react";
import { Search, Plus, Edit, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    useAllUsersBalances,
    useAdjustBalance,
    useInitializeBalance,
} from "@/lib/queries/leave";
import { useLeaveTypes } from "@/lib/queries/leave";
import { useQuery } from "@tanstack/react-query";
import { listEmployees, type ApiEmployee } from "@/lib/api/employees";

const adjustSchema = z.object({
    adjustment: z.string().min(1, "Adjustment is required"),
    reason: z.string().min(5, "Reason must be at least 5 characters"),
});

const initializeSchema = z.object({
    userId: z.string().min(1, "Employee is required"),
    leaveTypeId: z.string().min(1, "Leave type is required"),
    initialBalance: z.string().min(1, "Initial balance is required"),
});

type AdjustFormValues = z.infer<typeof adjustSchema>;
type InitializeFormValues = z.infer<typeof initializeSchema>;

export default function LeaveBalanceManagementPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
    const [initializeDialogOpen, setInitializeDialogOpen] = useState(false);
    const [selectedBalance, setSelectedBalance] = useState<{
        userId: string;
        leaveTypeId: string;
        employeeName: string;
        leaveTypeName: string;
        currentBalance: number;
    } | null>(null);

    const { data: balances, isLoading } = useAllUsersBalances();
    const { data: leaveTypes } = useLeaveTypes();

    // Fetch raw employee data for the initialization dropdown
    const { data: employees } = useQuery({
        queryKey: ["employees-raw"],
        queryFn: () => listEmployees(),
    });
    const adjustMutation = useAdjustBalance();
    const initializeMutation = useInitializeBalance();

    const adjustForm = useForm<AdjustFormValues>({
        resolver: zodResolver(adjustSchema),
        defaultValues: {
            adjustment: "",
            reason: "",
        },
    });

    const initializeForm = useForm<InitializeFormValues>({
        resolver: zodResolver(initializeSchema),
        defaultValues: {
            userId: "",
            leaveTypeId: "",
            initialBalance: "",
        },
    });

    const filteredBalances = balances?.filter((balance) => {
        const searchLower = searchQuery.toLowerCase();
        const employeeName =
            `${balance.user.employee?.firstName || ""} ${balance.user.employee?.lastName || ""}`.toLowerCase();
        const employeeCode =
            balance.user.employee?.employeeCode?.toLowerCase() || "";
        const email = balance.user.email.toLowerCase();
        const leaveType = balance.leaveType.name.toLowerCase();

        return (
            employeeName.includes(searchLower) ||
            employeeCode.includes(searchLower) ||
            email.includes(searchLower) ||
            leaveType.includes(searchLower)
        );
    });

    // Get unique users from employees data (better for initializing balances)
    const uniqueUsers = employees?.map((emp: ApiEmployee) => ({
        id: emp.user?.id || emp.id,
        name: `${emp.firstName} ${emp.lastName}`.trim(),
        code: emp.employeeCode,
        email: emp.user?.email || emp.personalEmail,
    })) || [];

    const handleOpenAdjustDialog = (balance: any) => {
        setSelectedBalance({
            userId: balance.userId,
            leaveTypeId: balance.leaveTypeId,
            employeeName:
                `${balance.user.employee?.firstName || ""} ${balance.user.employee?.lastName || ""}`.trim() ||
                balance.user.email,
            leaveTypeName: balance.leaveType.name,
            currentBalance: balance.balance,
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

    const handleInitializeBalance = async (values: InitializeFormValues) => {
        try {
            await initializeMutation.mutateAsync({
                userId: values.userId,
                leaveTypeId: values.leaveTypeId,
                initialBalance: parseFloat(values.initialBalance),
            });
            toast.success("Balance initialized successfully");
            setInitializeDialogOpen(false);
            initializeForm.reset();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || "Failed to initialize balance"
            );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm text-muted-foreground">HR Administration</p>
                    <h1 className="text-2xl font-semibold">Leave Balance Management</h1>
                </div>
                <Badge variant="secondary">
                    <Users className="mr-2 size-4" />
                    Manage employee leave balances
                </Badge>
            </div>

            {/* Stats */}
            {balances && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Employees
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{uniqueUsers.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Balances
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{balances.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Leave Types
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Set(balances.map((b) => b.leaveTypeId)).size}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Actions and Search */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Employee Leave Balances</CardTitle>
                            <CardDescription>
                                View and manage leave balances for all employees
                            </CardDescription>
                        </div>
                        <Button onClick={() => setInitializeDialogOpen(true)}>
                            <Plus className="mr-2 size-4" />
                            Initialize Balance
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by employee name, code, email, or leave type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="size-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredBalances && filteredBalances.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Employee Code</TableHead>
                                        <TableHead>Leave Type</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead className="text-right">Carry Forward</TableHead>
                                        <TableHead className="text-right">Total Available</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBalances.map((balance) => {
                                        const employeeName =
                                            `${balance.user.employee?.firstName || ""} ${balance.user.employee?.lastName || ""}`.trim() ||
                                            balance.user.email;
                                        const balanceValue = Number(balance.balance) || 0;
                                        const carryForwardValue = Number(balance.carryForward) || 0;
                                        const totalAvailable = balanceValue + carryForwardValue;

                                        return (
                                            <TableRow key={balance.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{employeeName}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {balance.user.email}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {balance.user.employee?.employeeCode || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {balance.leaveType.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {balance.leaveType.code}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {balanceValue}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {carryForwardValue > 0 ? (
                                                        <Badge variant="secondary">
                                                            {carryForwardValue}
                                                        </Badge>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {totalAvailable}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenAdjustDialog(balance)}
                                                    >
                                                        <Edit className="mr-2 size-4" />
                                                        Adjust
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            {searchQuery
                                ? "No balances found matching your search"
                                : "No leave balances found"}
                        </div>
                    )}
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
                                                placeholder="Explain why this adjustment is being made..."
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
                                            <Loader2 className="mr-2 size-4 animate-spin" />
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

            {/* Initialize Balance Dialog */}
            <Dialog
                open={initializeDialogOpen}
                onOpenChange={setInitializeDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Initialize Leave Balance</DialogTitle>
                        <DialogDescription>
                            Set up a new leave balance for an employee
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...initializeForm}>
                        <form
                            onSubmit={initializeForm.handleSubmit(handleInitializeBalance)}
                            className="space-y-4"
                        >
                            <FormField
                                control={initializeForm.control}
                                name="userId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employee</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select employee" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {uniqueUsers.map((user: { id: string; name: string; code?: string; email?: string | null }) => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.name} {user.code && `(${user.code})`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={initializeForm.control}
                                name="leaveTypeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Leave Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select leave type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(leaveTypes || []).map((type) => (
                                                    <SelectItem key={type.id} value={type.id}>
                                                        {type.name} ({type.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={initializeForm.control}
                                name="initialBalance"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Initial Balance (days)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                placeholder="e.g., 20"
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
                                    onClick={() => setInitializeDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={initializeMutation.isPending}>
                                    {initializeMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                            Initializing...
                                        </>
                                    ) : (
                                        "Initialize Balance"
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
