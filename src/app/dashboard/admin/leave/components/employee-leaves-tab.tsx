"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAllEmployeeLeaves } from "@/lib/queries/leave";
import {
    Search,
    FileText,
    ExternalLink,
    Pencil,
    XCircle,
    CalendarOff,
    MoreHorizontal,
    ArrowLeft,
    ArrowRight,
    Loader2,
} from "lucide-react";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";
import { LeaveAmendmentDialog } from "@/components/leave/leave-amendment-dialog";
import { getLeaveDocumentUrl, LeaveRecord } from "@/lib/api/leave";
import { toast } from "sonner";
import { useSession } from "@/components/auth/session-provider";

import { formatDateInDhaka, formatInDhakaTimezone } from "@/lib/utils";
import { useDepartments } from "@/lib/queries/departments";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import type { Department } from "@/lib/api/departments";

function formatDate(dateString: string) {
    return formatDateInDhaka(dateString, "long");
}

function formatDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startLabel = formatInDhakaTimezone(start, { month: "short", day: "numeric" });
    const endLabel = formatInDhakaTimezone(end, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    return `${startLabel} – ${endLabel}`;
}

export function EmployeeLeavesTab() {
    const { session } = useSession();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [departmentFilter, setDepartmentFilter] = useState<string | "all">("all");
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm.trim(), 300);
    const [statusFilter, setStatusFilter] = useState("all");
    const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");

    const { data, isLoading } = useAllEmployeeLeaves({
        page,
        pageSize,
        departmentId: departmentFilter === "all" ? undefined : departmentFilter,
        search: debouncedSearch || undefined,
    });
    const [loadingDocument, setLoadingDocument] = useState<string | null>(null);
    const [amendmentLeave, setAmendmentLeave] = useState<LeaveRecord | null>(null);
    const [amendmentMode, setAmendmentMode] = useState<"AMEND" | "CANCEL">("AMEND");

    const handleViewDocument = async (leaveId: string) => {
        setLoadingDocument(leaveId);
        try {
            const { url } = await getLeaveDocumentUrl(leaveId);
            window.open(url, "_blank");
        } catch (error: any) {
            toast.error("Failed to load document", {
                description: error?.response?.data?.message || "Unable to access the document",
            });
        } finally {
            setLoadingDocument(null);
        }
    };

    const leaves: LeaveRecord[] = data?.data ?? [];
    const pagination = data?.pagination;

    const uniqueStatuses = useMemo<string[]>(() => {
        if (!leaves) return [];
        return Array.from(new Set(leaves.map((l) => l.status)));
    }, [leaves]);

    const uniqueLeaveTypes = useMemo<string[]>(() => {
        if (!leaves) return [];
        return Array.from(
            new Set(leaves.map((l) => l.leaveType?.name ?? l.leaveTypeId))
        );
    }, [leaves]);

    const filteredLeaves = useMemo<LeaveRecord[]>(() => {
        if (!leaves) return [];
        return leaves.filter((leave) => {
            const matchesStatus = statusFilter === "all" || leave.status === statusFilter;
            const matchesLeaveType =
                leaveTypeFilter === "all" || leave.leaveType?.name === leaveTypeFilter;
            return matchesStatus && matchesLeaveType;
        });
    }, [leaves, statusFilter, leaveTypeFilter]);

    const sortedLeaves = useMemo(
        () =>
            [...(filteredLeaves ?? [])].sort(
                (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
            ),
        [filteredLeaves]
    );

    const totalFiltered = pagination?.totalCount ?? sortedLeaves.length;
    const totalPages = pagination?.totalPages ?? 1;
    const currentPage = pagination?.page ?? page;

    const { data: departments, isLoading: departmentsLoading } = useDepartments();

    const statCounts = useMemo(() => {
        const total = pagination?.totalCount ?? leaves.length;
        const approved = leaves.filter((l) => l.status === "APPROVED").length;
        const pending = leaves.filter((l) => l.status === "PENDING").length;
        const rejected = leaves.filter((l) => l.status === "REJECTED").length;
        return { total, approved, pending, rejected, pageTotal: leaves.length };
    }, [leaves, pagination]);

    return (
        <div className="space-y-4">
            {/* Stats row */}
            {statCounts.total > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Leaves</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statCounts.total}</div>
                            <p className="text-xs text-muted-foreground">all records</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approved</CardTitle>
                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                                {statCounts.pageTotal > 0
                                    ? ((statCounts.approved / statCounts.pageTotal) * 100).toFixed(0) + "%"
                                    : "—"}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                {statCounts.approved}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-400">
                                {statCounts.pageTotal > 0
                                    ? ((statCounts.pending / statCounts.pageTotal) * 100).toFixed(0) + "%"
                                    : "—"}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {statCounts.pending}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                            <Badge variant="outline" className="border-red-300 text-red-600 dark:text-red-400">
                                {statCounts.pageTotal > 0
                                    ? ((statCounts.rejected / statCounts.pageTotal) * 100).toFixed(0) + "%"
                                    : "—"}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {statCounts.rejected}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters bar */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
                <div className="relative min-w-[200px] flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search employee, type, reason…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 pl-8"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-full sm:w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {uniqueStatuses.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                    <SelectTrigger className="h-9 w-full sm:w-[160px]">
                        <SelectValue placeholder="Leave type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {uniqueLeaveTypes.map((t) => (
                            <SelectItem key={t} value={t}>
                                {t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    disabled={departmentsLoading || !departments}
                    value={departmentFilter}
                    onValueChange={(v) => {
                        setDepartmentFilter(v as typeof departmentFilter);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="h-9 w-full sm:w-[160px]">
                        <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments?.map((d: Department) => (
                            <SelectItem key={d.id} value={d.id}>
                                {d.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                        setPageSize(Number(v));
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="h-9 w-[90px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table card */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-0.5">
                            <CardTitle className="text-base">Leave records</CardTitle>
                            <CardDescription>
                                All leave requests across the organization
                            </CardDescription>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages} · {totalFiltered} total
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto border-t">
                        {isLoading ? (
                            <div className="p-4">
                                <TableSkeleton columns={9} rows={5} />
                            </div>
                        ) : sortedLeaves.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                                <CalendarOff className="size-6 text-muted-foreground" />
                                <span className="text-sm font-medium">No leave records found</span>
                                <span className="max-w-xs text-sm text-muted-foreground">
                                    Adjust your filters or search to see more results.
                                </span>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Employee</TableHead>
                                        <TableHead className="font-semibold">Leave Type</TableHead>
                                        <TableHead className="font-semibold">Period</TableHead>
                                        <TableHead className="font-semibold">Days</TableHead>
                                        <TableHead className="font-semibold">Reason</TableHead>
                                        <TableHead className="font-semibold">Document</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="font-semibold">Applied</TableHead>
                                        <TableHead className="w-12 font-semibold text-right"> </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedLeaves.map((leave: LeaveRecord, idx) => {
                                        const leaveDays =
                                            Math.ceil(
                                                (new Date(leave.endDate).getTime() -
                                                    new Date(leave.startDate).getTime()) /
                                                    (1000 * 60 * 60 * 24)
                                            ) + 1;

                                        const rowBg = idx % 2 !== 0 ? "bg-muted/20" : "";

                                        return (
                                            <TableRow
                                                key={leave.id}
                                                className={`${rowBg} transition-colors hover:bg-muted/40`}
                                            >
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium leading-tight">
                                                            {leave?.user?.employee
                                                                ? `${leave.user.employee.firstName} ${leave.user.employee.lastName}`
                                                                : "Unknown"}
                                                        </span>
                                                        {leave?.user?.employee?.employeeCode && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {leave.user.employee.employeeCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm">
                                                            {leave.leaveType?.name || leave.leaveTypeId}
                                                        </span>
                                                        {leave.leaveType?.code && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {leave.leaveType.code}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-sm">
                                                    {formatDateRange(leave.startDate, leave.endDate)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {leaveDays} {leaveDays === 1 ? "day" : "days"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[180px] truncate text-sm">
                                                    {leave.reason || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {leave.supportingDocumentUrl ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 gap-1 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                            onClick={() => handleViewDocument(leave.id)}
                                                            disabled={loadingDocument === leave.id}
                                                        >
                                                            {loadingDocument === leave.id ? (
                                                                <Loader2 className="size-3.5 animate-spin" />
                                                            ) : (
                                                                <FileText className="size-3.5" />
                                                            )}
                                                            View
                                                            <ExternalLink className="size-3" />
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <LeaveStatusBadge status={leave.status} />
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                                    {formatDate(leave.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-8">
                                                                <MoreHorizontal className="size-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/employee/leave/${leave.id}`}>
                                                                    <ExternalLink className="size-4" />
                                                                    View details
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {leave.status === "APPROVED" && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setAmendmentLeave(leave);
                                                                            setAmendmentMode("AMEND");
                                                                        }}
                                                                    >
                                                                        <Pencil className="size-4" />
                                                                        Amend
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        variant="destructive"
                                                                        onClick={() => {
                                                                            setAmendmentLeave(leave);
                                                                            setAmendmentMode("CANCEL");
                                                                        }}
                                                                    >
                                                                        <XCircle className="size-4" />
                                                                        Cancel leave
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between py-2">
                <p className="text-sm text-muted-foreground">
                    Page {currentPage}{totalPages > 1 ? ` of ${totalPages}` : ""} · {totalFiltered} total
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage <= 1 || isLoading}
                    >
                        <ArrowLeft className="mr-1.5 size-4" /> Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages || isLoading}
                    >
                        Next <ArrowRight className="ml-1.5 size-4" />
                    </Button>
                </div>
            </div>

            {/* Amendment dialog */}
            {amendmentLeave && (
                <LeaveAmendmentDialog
                    leave={amendmentLeave}
                    mode={amendmentMode}
                    open={!!amendmentLeave}
                    onOpenChange={(open) => !open && setAmendmentLeave(null)}
                    onSuccess={() => {
                        setAmendmentLeave(null);
                        toast.success(
                            amendmentMode === "AMEND"
                                ? "Amendment request created"
                                : "Cancellation request created",
                            { description: "Manager and HR will process the request." }
                        );
                    }}
                />
            )}
        </div>
    );
}
