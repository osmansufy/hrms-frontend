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
import { useDepartments } from "@/lib/queries/departments";
import { useLeaveTypes } from "@/lib/queries/leave";
import {
    Search,
    Download,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Edit,
    Loader2,
    LayoutGrid,
    LayoutList,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
// Format numbers to whole numbers (no decimals)
const formatDays = (value: number) =>
    new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Math.round(value));

import { BulkApplyLeaveTypesDialog } from "./bulk-apply-leave-types-dialog";
import { BulkResetLeaveBalancesDialog } from "./bulk-reset-leave-balances-dialog";

const adjustSchema = z.object({
    adjustment: z.string().min(1, "Adjustment is required").refine(
        (val) => !isNaN(parseFloat(val)),
        "Adjustment must be a valid number"
    ),
    reason: z.string().min(10, "Reason must be at least 10 characters long for audit purposes"),
});

type AdjustFormValues = z.infer<typeof adjustSchema>;

type ViewMode = "cards" | "table";

interface GroupedBalance {
    userId: string;
    employeeName: string;
    employeeCode: string;
    employeeEmail: string;
    personalEmail?: string | null;
    department: string;
    totalAvailable: number;
    totalUsed: number;
    totalAllocated: number;
    overallStatus: "NORMAL" | "LOW" | "NEGATIVE";
    leaveTypes: Array<{
        id: string;
        leaveTypeId: string;
        leaveTypeName: string;
        available: number;
        used: number;
        allocated: number;
        status: string;
        balances: any;
    }>;
}

export function LeaveBalancesTab() {
    const currentYear = new Date().getUTCFullYear();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<"low" | "normal" | "negative" | "">("");
    const [departmentId, setDepartmentId] = useState<string>("");
    const [leaveTypeId, setLeaveTypeId] = useState<string>("");
    const [year, setYear] = useState(currentYear);
    const [viewMode, setViewMode] = useState<ViewMode>("cards");
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
    const [bulkApplyDialogOpen, setBulkApplyDialogOpen] = useState(false);
    const [bulkResetDialogOpen, setBulkResetDialogOpen] = useState(false);
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
        departmentId: departmentId || undefined,
        leaveTypeId: leaveTypeId || undefined,
        year,
    });

    const { data: departments } = useDepartments();
    const { data: leaveTypes } = useLeaveTypes();

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
                leaveTypeId: leaveTypeId || undefined,
                departmentId: departmentId || undefined,
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

    const toggleCardExpansion = (userId: string) => {
        setExpandedCards((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    // Group balances by employee
    const groupedBalances: GroupedBalance[] = data?.data.reduce((acc: GroupedBalance[], balance) => {
        const existingEmployee = acc.find((emp) => emp.userId === balance.userId);

        const allocated =
            balance.balances.openingBalance +
            balance.balances.accrued +
            balance.balances.carried +
            balance.balances.adjusted;

        if (existingEmployee) {
            existingEmployee.totalAvailable += balance.balances.available;
            existingEmployee.totalUsed += balance.balances.used;
            existingEmployee.totalAllocated += allocated;
            existingEmployee.leaveTypes.push({
                id: balance.id,
                leaveTypeId: balance.leaveType.id,
                leaveTypeName: balance.leaveType.name,
                available: balance.balances.available,
                used: balance.balances.used,
                allocated,
                status: balance.status,
                balances: balance.balances,
            });

            // Update overall status to worst case
            if (balance.status === "NEGATIVE") {
                existingEmployee.overallStatus = "NEGATIVE";
            } else if (balance.status === "LOW" && existingEmployee.overallStatus !== "NEGATIVE") {
                existingEmployee.overallStatus = "LOW";
            }
        } else {
            acc.push({
                userId: balance.userId,
                employeeName: balance.employee.name,
                employeeCode: balance.employee.employeeCode,
                employeeEmail: balance.employee.email,
                personalEmail: balance.employee.personalEmail,
                department: balance.employee.department?.name || "N/A",
                totalAvailable: balance.balances.available,
                totalUsed: balance.balances.used,
                totalAllocated: allocated,
                overallStatus: balance.status as "NORMAL" | "LOW" | "NEGATIVE",
                leaveTypes: [{
                    id: balance.id,
                    leaveTypeId: balance.leaveType.id,
                    leaveTypeName: balance.leaveType.name,
                    available: balance.balances.available,
                    used: balance.balances.used,
                    allocated,
                    status: balance.status,
                    balances: balance.balances,
                }],
            });
        }
        return acc;
    }, []) || [];

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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                            {/* Search */}
                            <div className="relative lg:col-span-2">
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

                            {/* Department Filter */}
                            <Select
                                value={departmentId || "all"}
                                onValueChange={(value) => {
                                    setDepartmentId(value === "all" ? "" : value);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments?.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Leave Type Filter */}
                            <Select
                                value={leaveTypeId || "all"}
                                onValueChange={(value) => {
                                    setLeaveTypeId(value === "all" ? "" : value);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Leave Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Leave Types</SelectItem>
                                    {leaveTypes?.map((lt) => (
                                        <SelectItem key={lt.id} value={lt.id}>
                                            {lt.name}
                                        </SelectItem>
                                    ))}
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
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            {/* Export Button */}
                            <Button
                                onClick={handleExport}
                                disabled={exportMutation.isPending || !data || data.data.length === 0}
                                variant="outline"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {exportMutation.isPending ? "Exporting..." : "Export CSV"}
                            </Button>

                            {/* Bulk Apply Leave Types Button */}
                            <Button
                                onClick={() => setBulkApplyDialogOpen(true)}
                                variant="default"
                            >
                                Apply Leave Types to All
                            </Button>

                            {/* Reset Balances Button */}
                            <Button
                                onClick={() => setBulkResetDialogOpen(true)}
                                variant="destructive"
                            >
                                Reset Balances
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

                        {/* View Toggle */}
                        <div className="flex items-center justify-between pt-2 border-t">
                            <p className="text-sm text-muted-foreground">
                                {viewMode === "cards"
                                    ? "Grouped by employee with expandable details"
                                    : "Detailed breakdown by leave type"}
                            </p>
                            <div className="flex gap-1 bg-muted p-1 rounded-lg">
                                <Button
                                    size="sm"
                                    variant={viewMode === "cards" ? "default" : "ghost"}
                                    onClick={() => setViewMode("cards")}
                                    className="gap-2"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                    Cards
                                </Button>
                                <Button
                                    size="sm"
                                    variant={viewMode === "table" ? "default" : "ghost"}
                                    onClick={() => setViewMode("table")}
                                    className="gap-2"
                                >
                                    <LayoutList className="h-4 w-4" />
                                    Table
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card View */}
            {viewMode === "cards" && (
                <div className="grid gap-4">
                    {!groupedBalances || groupedBalances.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                No leave balances found.
                            </CardContent>
                        </Card>
                    ) : (
                        groupedBalances.map((employee) => {
                            const isExpanded = expandedCards.has(employee.userId);
                            const usagePercentage = employee.totalAllocated > 0
                                ? (employee.totalUsed / employee.totalAllocated) * 100
                                : 0;

                            return (
                                <Card key={employee.userId} className="overflow-hidden">
                                    <div className="p-6">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-lg">
                                                        {employee.employeeName}
                                                    </h3>
                                                    <Badge
                                                        variant={
                                                            employee.overallStatus === "NEGATIVE"
                                                                ? "destructive"
                                                                : employee.overallStatus === "LOW"
                                                                    ? "secondary"
                                                                    : "default"
                                                        }
                                                        className={
                                                            employee.overallStatus === "LOW"
                                                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                                                : employee.overallStatus === "NORMAL"
                                                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                                    : ""
                                                        }
                                                    >
                                                        {employee.overallStatus}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                    <span className="font-mono">{employee.employeeCode}</span>
                                                    <span>•</span>
                                                    <span>{employee.employeeEmail}</span>
                                                    <span>•</span>
                                                    <span>{employee.department}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Summary Stats */}
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                                                <p className="text-xs text-muted-foreground mb-1">Total Available</p>
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {formatDays(employee.totalAvailable)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">days</p>
                                            </div>
                                            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4">
                                                <p className="text-xs text-muted-foreground mb-1">Total Used</p>
                                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                                    {formatDays(employee.totalUsed)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">days</p>
                                            </div>
                                            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
                                                <p className="text-xs text-muted-foreground mb-1">Total Allocated</p>
                                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                    {formatDays(employee.totalAllocated)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">days</p>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-muted-foreground">Leave Usage</span>
                                                <span className="font-medium">
                                                    {usagePercentage.toFixed(1)}%
                                                </span>
                                            </div>
                                            <Progress value={usagePercentage} className="h-2" />
                                        </div>

                                        {/* Expand/Collapse Button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleCardExpansion(employee.userId)}
                                            className="w-full justify-between"
                                        >
                                            <span className="text-sm font-medium">
                                                {isExpanded ? "Hide" : "Show"} breakdown by leave type
                                                ({employee.leaveTypes.length} types)
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="mt-4 border-t pt-4 space-y-3">
                                                {employee.leaveTypes.map((leaveType) => {
                                                    const ltUsagePercentage = leaveType.allocated > 0
                                                        ? (leaveType.used / leaveType.allocated) * 100
                                                        : 0;

                                                    return (
                                                        <div
                                                            key={leaveType.id}
                                                            className="bg-muted/50 rounded-lg p-4"
                                                        >
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div>
                                                                    <h4 className="font-medium mb-1">
                                                                        {leaveType.leaveTypeName}
                                                                    </h4>
                                                                    <div className="flex gap-4 text-sm">
                                                                        <span className="text-muted-foreground">
                                                                            Available: <strong className="text-foreground">{formatDays(leaveType.available)}</strong>
                                                                        </span>
                                                                        <span className="text-muted-foreground">
                                                                            Used: <strong className="text-foreground">{formatDays(leaveType.used)}</strong>
                                                                        </span>
                                                                        <span className="text-muted-foreground">
                                                                            Allocated: <strong className="text-foreground">{formatDays(leaveType.allocated)}</strong>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        handleOpenAdjustDialog({
                                                                            userId: employee.userId,
                                                                            leaveType: {
                                                                                id: leaveType.leaveTypeId,
                                                                                name: leaveType.leaveTypeName,
                                                                            },
                                                                            employee: {
                                                                                name: employee.employeeName,
                                                                            },
                                                                            balances: {
                                                                                available: leaveType.available,
                                                                            },
                                                                        })
                                                                    }
                                                                >
                                                                    <Edit className="mr-2 h-3 w-3" />
                                                                    Adjust
                                                                </Button>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center justify-between text-xs mb-1">
                                                                    <span className="text-muted-foreground">Usage</span>
                                                                    <span className="font-medium">
                                                                        {ltUsagePercentage.toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                                <Progress value={ltUsagePercentage} className="h-1.5" />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            {/* Balances Table */}
            {viewMode === "table" && (
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
                                                            {formatDays(balance.balances.available)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatDays(balance.balances.used)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatDays(
                                                            balance.balances.openingBalance +
                                                            balance.balances.accrued +
                                                            balance.balances.carried +
                                                            balance.balances.adjusted
                                                        )}
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
            )}

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
                            <strong>{formatDays(selectedBalance.currentBalance)} days</strong>
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

            {/* Bulk Apply Leave Types Dialog */}
            <BulkApplyLeaveTypesDialog
                open={bulkApplyDialogOpen}
                onOpenChange={setBulkApplyDialogOpen}
                onSuccess={() => {
                    // Refresh the data
                    window.location.reload();
                }}
            />

            {/* Bulk Reset Leave Balances Dialog */}
            <BulkResetLeaveBalancesDialog
                open={bulkResetDialogOpen}
                onOpenChange={setBulkResetDialogOpen}
                onSuccess={() => {
                    window.location.reload();
                }}
            />
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
                    <Skeleton className="h-20 w-full mt-4" />
                </CardContent>
            </Card>
            <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full" />
                ))}
            </div>
        </div>
    );
}
