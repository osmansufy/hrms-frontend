"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Search, X, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAttendanceReconciliationRequests,
    updateReconciliationStatus,
    type AttendanceReconciliationListResponse,
    type AttendanceReconciliationRequestResponse,
} from "@/lib/api/attendance";
import { formatDateInDhaka, formatTimeInTimezone } from "@/lib/utils";
import { toast } from "sonner";
import { useDepartments } from "@/lib/queries/departments";
import { useEmployees } from "@/lib/queries/employees";
import { useTimezone } from "@/contexts/timezone-context";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function useDebounced<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function AttendanceReconciliationAdminPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { timezone } = useTimezone();
    const [editingRequest, setEditingRequest] = useState<AttendanceReconciliationRequestResponse | null>(null);
    const [correctedTime, setCorrectedTime] = useState("");
    const [reviewerComment, setReviewerComment] = useState("");
    const [monthFilter, setMonthFilter] = useState<string>("all");
    const [yearFilter, setYearFilter] = useState<string>("all");
    const [employeeFilter, setEmployeeFilter] = useState<string>("all");
    const [searchInput, setSearchInput] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const searchDebounced = useDebounced(searchInput, 400);
    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

    // Fetch departments and employees
    const { data: departments } = useDepartments();
    const { data: employees = [] } = useEmployees();

    // Helper to get timezone offset in hours (simplified - works for most cases)
    const getTimezoneOffsetHours = (tz: string): number => {
        // Common timezones - can be expanded
        const offsets: Record<string, number> = {
            "Asia/Dhaka": 6,
            "Asia/Kolkata": 5.5,
            "Asia/Karachi": 5,
            "Asia/Dubai": 4,
            "America/New_York": -5,
            "America/Chicago": -6,
            "America/Los_Angeles": -8,
            "Europe/London": 0,
            "Europe/Paris": 1,
        };
        return offsets[tz] ?? 6; // Default to +6 if unknown
    };

    // Build API params from filters (only month+year together for month-wise)
    const queryParams = useMemo(() => {
        const month = monthFilter === "all" ? undefined : parseInt(monthFilter, 10);
        const year = yearFilter === "all" ? undefined : parseInt(yearFilter, 10);
        return {
            page,
            limit,
            month: month ? month : undefined,
            year: year ? year : undefined,
            userId: employeeFilter === "all" ? undefined : employeeFilter,
            departmentId: departmentFilter === "all" ? undefined : departmentFilter,
            status: statusFilter === "all" ? undefined : (statusFilter as "PENDING" | "APPROVED" | "REJECTED"),
            search: searchDebounced.trim() || undefined,
        };
    }, [page, limit, monthFilter, yearFilter, employeeFilter, searchDebounced, departmentFilter, statusFilter]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [monthFilter, yearFilter, employeeFilter, searchDebounced, departmentFilter, statusFilter]);
    // Fetch all reconciliation requests (admin/HR)
    const { data: reconciliationRequests, isLoading } = useQuery<AttendanceReconciliationListResponse>({
        queryKey: ["attendance-reconciliation-requests", queryParams],
        queryFn: () => getAttendanceReconciliationRequests(queryParams),
    });

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: (id: string) => updateReconciliationStatus(id, { status: "APPROVED" }),
        onMutate: (id: string) => {
            setPendingRequestId(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance-reconciliation-requests"] });
            toast.success("Reconciliation approved successfully");
            setPendingRequestId(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || "Failed to approve reconciliation";
            toast.error(message);
            setPendingRequestId(null);
        },
    });

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: (id: string) => updateReconciliationStatus(id, { status: "REJECTED" }),
        onMutate: (id: string) => {
            setPendingRequestId(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance-reconciliation-requests"] });
            toast.success("Reconciliation rejected successfully");
            setPendingRequestId(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || "Failed to reject reconciliation";
            toast.error(message);
            setPendingRequestId(null);
        },
    });

    // Edit and approve mutation
    const editAndApproveMutation = useMutation({
        mutationFn: (payload: { id: string; correctedSignIn?: string; correctedSignOut?: string; reviewerComment?: string }) =>
            updateReconciliationStatus(payload.id, {
                status: "APPROVED",
                reviewerComment: payload.reviewerComment || undefined,
                correctedSignIn: payload.correctedSignIn,
                correctedSignOut: payload.correctedSignOut,
            }),
        onMutate: (payload: { id: string; correctedSignIn?: string; correctedSignOut?: string; reviewerComment?: string }) => {
            setPendingRequestId(payload.id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance-reconciliation-requests"] });
            toast.success("Reconciliation approved successfully");
            setEditingRequest(null);
            setCorrectedTime("");
            setReviewerComment("");
            setPendingRequestId(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || "Failed to approve reconciliation. Please try again.";
            toast.error(message);
            setPendingRequestId(null);
        },
    });

    const tableData = reconciliationRequests?.data ?? [];
    
    // Count active filters
    const activeFiltersCount = [
        monthFilter !== "all" && yearFilter !== "all",
        employeeFilter !== "all",
        searchDebounced.trim(),
        departmentFilter !== "all",
        statusFilter !== "all",
    ].filter(Boolean).length;

    const handleClearFilters = () => {
        setMonthFilter("all");
        setYearFilter("all");
        setEmployeeFilter("all");
        setSearchInput("");
        setDepartmentFilter("all");
        setStatusFilter("all");
    };

    const handleApprove = (id: string) => {
        approveMutation.mutate(id);
    };

    const handleReject = (id: string) => {
        rejectMutation.mutate(id);
    };

    const handleEditAndApprove = (req: AttendanceReconciliationRequestResponse) => {
        setEditingRequest(req);
        // Pre-fill with employee's requested time - convert UTC to system timezone local time
        const offsetHours = getTimezoneOffsetHours(timezone);
        if (req.type === "SIGN_IN" && req.requestedSignIn) {
            const utcDate = new Date(req.requestedSignIn);
            // Convert UTC to system timezone for datetime-local input
            const localTime = new Date(utcDate.getTime() + (offsetHours * 60 * 60 * 1000));
            setCorrectedTime(localTime.toISOString().slice(0, 16));
        } else if (req.type === "SIGN_OUT" && req.requestedSignOut) {
            const utcDate = new Date(req.requestedSignOut);
            // Convert UTC to system timezone for datetime-local input
            const localTime = new Date(utcDate.getTime() + (offsetHours * 60 * 60 * 1000));
            setCorrectedTime(localTime.toISOString().slice(0, 16));
        } else {
            setCorrectedTime("");
        }
        setReviewerComment("");
    };

    const handleSubmitCorrectedApproval = () => {
        if (!editingRequest) return;

        // Validate that we have either corrected time or employee's requested time
        const hasTime = correctedTime ||
            (editingRequest.type === "SIGN_IN" && editingRequest.requestedSignIn) ||
            (editingRequest.type === "SIGN_OUT" && editingRequest.requestedSignOut);

        if (!hasTime) {
            toast.error("Please provide a corrected time");
            return;
        }

        // Prepare payload
        let correctedSignIn: string | undefined;
        let correctedSignOut: string | undefined;

        // Add corrected time if provided - convert from system timezone to UTC
        if (correctedTime) {
            // datetime-local gives us local time, we need to specify it's in the system timezone
            const offsetHours = getTimezoneOffsetHours(timezone);
            const offsetSign = offsetHours >= 0 ? "+" : "-";
            const offsetHoursAbs = Math.abs(offsetHours);
            const offsetMins = Math.abs((offsetHours % 1) * 60);
            const offsetStr = `${offsetSign}${String(offsetHoursAbs).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
            const dateTimeWithTz = correctedTime + ":00" + offsetStr;
            const correctedDate = new Date(dateTimeWithTz);

            if (editingRequest.type === "SIGN_IN") {
                correctedSignIn = correctedDate.toISOString();
            } else if (editingRequest.type === "SIGN_OUT") {
                correctedSignOut = correctedDate.toISOString();
            }
        }

        editAndApproveMutation.mutate({
            id: editingRequest.id,
            correctedSignIn,
            correctedSignOut,
            reviewerComment: reviewerComment || undefined,
        });
    };

    return (
        <div className="container space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} title="Back">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-semibold">Attendance Reconciliation</h1>
            </div>
            <Card>
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                        <CardTitle>Reconciliation Requests</CardTitle>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Loading...</span>
                                </div>
                            ) : (
                                <span className="font-medium">
                                    {reconciliationRequests?.pagination.totalCount ?? 0} {reconciliationRequests?.pagination.totalCount === 1 ? "request" : "requests"}
                                </span>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by employee name or email..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-10 h-11 text-base"
                        />
                        {searchInput && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                                onClick={() => setSearchInput("")}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Filters Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-sm font-medium">Filters</h3>
                                {activeFiltersCount > 0 && (
                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                        {activeFiltersCount} active
                                    </span>
                                )}
                            </div>
                            {activeFiltersCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearFilters}
                                    className="h-8 text-xs"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear all
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            {/* Date Filters */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Month</label>
                                <Select value={monthFilter} onValueChange={setMonthFilter}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="All months" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All months</SelectItem>
                                        {MONTHS.map((m, i) => (
                                            <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Year</label>
                                <Select value={yearFilter} onValueChange={setYearFilter}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="All years" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All years</SelectItem>
                                        {yearOptions.map((y) => (
                                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Employee & Department Filters */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee</label>
                                <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="All employees" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All employees</SelectItem>
                                        {employees.filter((e) => e.userId).map((emp) => (
                                            <SelectItem key={emp.userId!} value={emp.userId!}>
                                                {emp.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</label>
                                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="All departments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All departments</SelectItem>
                                        {departments?.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-2 sm:col-span-2 lg:col-span-1 xl:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="PENDING">
                                            <span className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                                Pending
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="APPROVED">
                                            <span className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                                Approved
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="REJECTED">
                                            <span className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-red-500" />
                                                Rejected
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t" />

                    {/* Table */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Loading reconciliation requests...</p>
                        </div>
                    ) : tableData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                            <div className="rounded-full bg-muted p-3">
                                <Search className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">No requests found</p>
                                <p className="text-sm text-muted-foreground">
                                    {activeFiltersCount > 0
                                        ? "Try adjusting your filters to see more results"
                                        : "There are no reconciliation requests at the moment"}
                                </p>
                            </div>
                            {activeFiltersCount > 0 && (
                                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                                    <X className="h-4 w-4 mr-2" />
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Date</TableHead>
                                        <TableHead className="font-semibold">Employee</TableHead>
                                        <TableHead className="font-semibold">Department</TableHead>
                                        <TableHead className="font-semibold">Type</TableHead>
                                        <TableHead className="font-semibold">Original Time</TableHead>
                                        <TableHead className="font-semibold">Requested Time</TableHead>
                                        <TableHead className="font-semibold">Reason</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="font-semibold text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                            <TableBody>
                                {tableData.map((req) => (
                                    <TableRow key={req.id} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">{formatDateInDhaka(req.date, "long")}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {req.user?.employee
                                                        ? `${req.user.employee.firstName} ${req.user.employee.lastName}`
                                                        : req.userId}
                                                </span>
                                                {req.user?.employee?.employeeCode && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {req.user.employee.employeeCode}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">
                                                {req.user?.employee?.department?.name || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20">
                                                {req.type.replace("_", " ")}
                                            </span>
                                        </TableCell>
                                            <TableCell className="text-sm">
                                                {req.type === "SIGN_IN"
                                                    ? (req.originalSignIn ? formatTimeInTimezone(req.originalSignIn) : "Missing")
                                                    : (req.originalSignOut ? formatTimeInTimezone(req.originalSignOut) : "Missing")}
                                            </TableCell>
                                            <TableCell className="text-sm font-semibold">
                                                {req.type === "SIGN_IN"
                                                    ? (req.requestedSignIn ? formatTimeInTimezone(req.requestedSignIn) : "-")
                                                    : (req.requestedSignOut ? formatTimeInTimezone(req.requestedSignOut) : "-")}
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <p className="truncate text-sm cursor-help">
                                                                {req.reason}
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-md">
                                                            <p className="whitespace-normal">
                                                                {req.reason}
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            <TableCell>
                                                {req.status === "APPROVED" ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                                                        Approved
                                                    </span>
                                                ) : req.status === "REJECTED" ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                                                        Rejected
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-600" />
                                                        Pending
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {req.status === "PENDING" && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApprove(req.id)}
                                                            disabled={!!pendingRequestId}
                                                            className="h-8"
                                                        >
                                                            {pendingRequestId === req.id && approveMutation.isPending ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                                    Approving...
                                                                </>
                                                            ) : (
                                                                "Approve"
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => handleEditAndApprove(req)}
                                                            disabled={!!pendingRequestId}
                                                            className="h-8"
                                                        >
                                                            Edit & Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleReject(req.id)}
                                                            disabled={!!pendingRequestId}
                                                            className="h-8"
                                                        >
                                                            {pendingRequestId === req.id && rejectMutation.isPending ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                                    Rejecting...
                                                                </>
                                                            ) : (
                                                                "Reject"
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!isLoading && tableData.length > 0 && reconciliationRequests?.pagination && (
                        <div className="flex items-center justify-between border-t pt-4">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                                    <Select
                                        value={String(limit)}
                                        onValueChange={(value) => {
                                            setLimit(Number(value));
                                            setPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-16">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="20">20</SelectItem>
                                            <SelectItem value="30">30</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, reconciliationRequests.pagination.totalCount)} of {reconciliationRequests.pagination.totalCount} results
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((old) => Math.max(old - 1, 1))}
                                    disabled={page === 1}
                                    className="h-8"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium px-2">
                                        Page {page} of {reconciliationRequests.pagination.totalPages}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((old) => old + 1)}
                                    disabled={page >= reconciliationRequests.pagination.totalPages}
                                    className="h-8"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Time Dialog */}
            <Dialog open={!!editingRequest} onOpenChange={(open) => !open && setEditingRequest(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit & Approve Reconciliation</DialogTitle>
                    </DialogHeader>
                    {editingRequest && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600">Employee: {editingRequest.user?.employee
                                    ? `${editingRequest.user.employee.firstName} ${editingRequest.user.employee.lastName}`
                                    : editingRequest.userId}</p>
                                <p className="text-sm text-gray-600">Date: {formatDateInDhaka(editingRequest.date, "long")}</p>
                                <p className="text-sm text-gray-600">Type: {editingRequest.type}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Original Time</label>
                                <p className="text-sm">
                                    {editingRequest.type === "SIGN_IN"
                                        ? (editingRequest.originalSignIn ? formatTimeInTimezone(editingRequest.originalSignIn) : "Missing")
                                        : (editingRequest.originalSignOut ? formatTimeInTimezone(editingRequest.originalSignOut) : "Missing")}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Employee Requested Time</label>
                                <p className="text-sm font-semibold text-blue-600">
                                    {editingRequest.type === "SIGN_IN"
                                        ? (editingRequest.requestedSignIn ? formatTimeInTimezone(editingRequest.requestedSignIn) : "-")
                                        : (editingRequest.requestedSignOut ? formatTimeInTimezone(editingRequest.requestedSignOut) : "-")}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Corrected Time (Admin Override)
                                    <span className="text-xs text-gray-500 ml-2">(Leave empty to use employee's requested time)</span>
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={correctedTime}
                                    onChange={(e) => setCorrectedTime(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Reason from Employee</label>
                                <p className="text-sm text-gray-700">{editingRequest.reason}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">Reviewer Comment (Optional)</label>
                                <Textarea
                                    value={reviewerComment}
                                    onChange={(e) => setReviewerComment(e.target.value)}
                                    placeholder="Add your comment..."
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingRequest(null)}
                            disabled={editAndApproveMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitCorrectedApproval}
                            disabled={editAndApproveMutation.isPending}
                        >
                            {editAndApproveMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                "Approve with Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
