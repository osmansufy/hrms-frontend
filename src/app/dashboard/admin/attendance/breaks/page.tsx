"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Search,
    Plus,
    Coffee,
    MoreHorizontal,
    Pencil,
    Trash2,
    X,
    ClipboardList,
    Clock,
    TrendingDown,
    GitMerge,
    CalendarRange,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
    adminGetAllBreaks,
    adminDeleteBreak,
    BreakType,
    getBreakTypeLabel,
    getBreakTypeIcon,
    formatBreakDuration,
    type AdminBreakListParams,
    type AttendanceBreakWithUser,
} from "@/lib/api/attendance";
import { listDepartments } from "@/lib/api/departments";
import { listEmployees } from "@/lib/api/employees";
import { BreakDialog } from "./components/break-dialog";
import { toLocalDateStr } from "@/lib/utils";
import {
    DATE_RANGE_PRESETS,
    type DateRangePreset,
    useDateRangePresets,
} from "@/hooks/useDateRangePresets";

const NAV_LINKS = [
    { href: "/dashboard/admin/attendance", icon: Clock, label: "Overview" },
    { href: "/dashboard/admin/attendance/policies", icon: ClipboardList, label: "Policies" },
    { href: "/dashboard/admin/work-schedules", icon: Clock, label: "Work Schedules" },
    { href: "/dashboard/admin/attendance/breaks", icon: Coffee, label: "Break Management" },
    { href: "/dashboard/admin/attendance/reports/lost-hours", icon: TrendingDown, label: "Lost Hours" },
    { href: "/dashboard/admin/attendance/reconciliation", icon: GitMerge, label: "Reconciliation" },
] as const;

const LIMITS_OPTIONS = [
    { label: "10 per page", value: "10" },
    { label: "30 per page", value: "30" },
    { label: "50 per page", value: "50" },
    { label: "100 per page", value: "100" },
];

export default function BreaksManagementPage() {
    const queryClient = useQueryClient();

    const todayLabel = useMemo(
        () =>
            new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
            }),
        []
    );

    // Filter states
    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState("all");
    const [employeeId, setEmployeeId] = useState("all");
    const [breakTypeFilter, setBreakTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(30);

    // Date range
    const { preset, dateRange, setPreset, setCustomRange } =
        useDateRangePresets("today");

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedBreak, setSelectedBreak] =
        useState<AttendanceBreakWithUser | null>(null);

    // Fetch breaks
    const params: AdminBreakListParams = {
        page,
        limit,
        ...(search && { search }),
        ...(departmentId !== "all" && { departmentId }),
        ...(employeeId !== "all" && { userId: employeeId }),
        ...(breakTypeFilter !== "all" && { breakType: breakTypeFilter as BreakType }),
        ...(statusFilter !== "all" && { status: statusFilter as "open" | "closed" }),
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
    };

    const { data: breaksData, isLoading } = useQuery({
        queryKey: ["admin-breaks", params],
        queryFn: () => adminGetAllBreaks(params),
    });

    // Fetch departments and employees for filters
    const { data: departments } = useQuery({
        queryKey: ["departments"],
        queryFn: listDepartments,
    });

    const { data: employees } = useQuery({
        queryKey: ["employees"],
        queryFn: () => listEmployees({}),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: adminDeleteBreak,
        onSuccess: () => {
            toast.success("Break deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["admin-breaks"] });
            setDeleteDialogOpen(false);
            setSelectedBreak(null);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to delete break");
        },
    });

    // Handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleDepartmentChange = (value: string) => {
        setDepartmentId(value);
        setPage(1);
    };

    const handleEmployeeChange = (value: string) => {
        setEmployeeId(value);
        setPage(1);
    };

    const handleEdit = (breakRecord: AttendanceBreakWithUser) => {
        setSelectedBreak(breakRecord);
        setEditDialogOpen(true);
    };

    const handleDelete = (breakRecord: AttendanceBreakWithUser) => {
        setSelectedBreak(breakRecord);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedBreak) {
            deleteMutation.mutate(selectedBreak.id);
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Calculate statistics
    const stats = useMemo(() => {
        if (!breaksData?.data) return null;

        const total = breaksData.meta.total || 0;
        const openBreaks = breaksData.data.filter((b) => !b.endTime).length;
        const closedBreaks = breaksData.data.filter((b) => b.endTime).length;
        const totalMinutes = breaksData.data
            .filter((b) => b.durationMinutes)
            .reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

        return {
            total,
            openBreaks,
            closedBreaks,
            totalMinutes,
            avgMinutes: closedBreaks > 0 ? Math.round(totalMinutes / closedBreaks) : 0,
        };
    }, [breaksData]);

    const hasActiveFilters =
        Boolean(search) ||
        departmentId !== "all" ||
        employeeId !== "all" ||
        breakTypeFilter !== "all" ||
        statusFilter !== "all" ||
        preset !== "today";

    const clearFilters = () => {
        setSearch("");
        setDepartmentId("all");
        setEmployeeId("all");
        setBreakTypeFilter("all");
        setStatusFilter("all");
        setPreset("today");
        setCustomRange({ startDate: toLocalDateStr(), endDate: toLocalDateStr() });
        setPage(1);
        setLimit(30);
    };

    const exportCsv = () => {
        const rows = breaksData?.data ?? [];
        if (!rows.length) {
            toast.info("No rows to export");
            return;
        }

        const header = [
            "Employee",
            "Employee Code",
            "Department",
            "Break Type",
            "Status",
            "Start Time",
            "End Time",
            "Duration (minutes)",
        ];

        const lines = [
            header,
            ...rows.map((b) => [
                b.user.name ?? "",
                b.user.employee?.employeeCode ?? "",
                b.user.employee?.department?.name ?? "",
                getBreakTypeLabel(b.breakType),
                b.endTime ? "Completed" : "Active",
                new Date(b.startTime).toISOString(),
                b.endTime ? new Date(b.endTime).toISOString() : "",
                b.durationMinutes?.toString() ?? "",
            ]),
        ]
            .map((cols) =>
                cols
                    .map((c) => `"${String(c).replaceAll(`"`, `""`)}"`)
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `breaks-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="container space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {todayLabel}
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">Break Management</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Review active breaks, correct timings, and export datasets
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={exportCsv}
                        disabled={!breaksData?.data?.length}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        Export CSV
                    </Button>
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        size="sm"
                        className="gap-2"
                    >
                        <Plus className="size-4" />
                        Create break
                    </Button>
                </div>
            </div>

            {/* ── Quick-nav strip ── */}
            <div className="flex flex-wrap gap-2">
                {NAV_LINKS.map(({ href, icon: Icon, label }) => (
                    <Link key={href} href={href}>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-muted-foreground hover:text-foreground"
                        >
                            <Icon className="size-3.5" />
                            {label}
                        </Button>
                    </Link>
                ))}
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Breaks</CardTitle>
                            <Coffee className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                                Live
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.openBreaks}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <Badge variant="secondary">Closed</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.closedBreaks}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Duration
                            </CardTitle>
                            <Badge variant="outline">Time</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatBreakDuration(stats.totalMinutes)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Avg Duration
                            </CardTitle>
                            <Badge variant="outline">Avg</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatBreakDuration(stats.avgMinutes)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Date Range Filter */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <CalendarRange className="size-4 text-muted-foreground" />
                        Date Range
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {DATE_RANGE_PRESETS.map((opt) => {
                            const active = preset === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setPreset(opt.value as DateRangePreset);
                                        setPage(1);
                                    }}
                                    className={[
                                        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        active
                                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                            : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                                    ].join(" ")}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>

                    {preset === "custom" && (
                        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 sm:max-w-sm">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">
                                    From
                                </label>
                                <Input
                                    type="date"
                                    value={dateRange.startDate}
                                    max={format(new Date(), "yyyy-MM-dd")}
                                    className="h-8 text-sm"
                                    onChange={(e) => {
                                        setCustomRange({ startDate: e.target.value });
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">
                                    To
                                </label>
                                <Input
                                    type="date"
                                    value={dateRange.endDate}
                                    max={format(new Date(), "yyyy-MM-dd")}
                                    className="h-8 text-sm"
                                    onChange={(e) => {
                                        setCustomRange({ endDate: e.target.value });
                                        setPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarRange className="size-3.5 shrink-0" />
                        <span className="font-medium text-foreground">
                            {dateRange.startDate === dateRange.endDate
                                ? dateRange.startDate
                                : `${dateRange.startDate} – ${dateRange.endDate}`}
                        </span>
                    </p>
                </CardContent>
            </Card>

            {/* Filters */}
            <Card>
                <CardHeader className="space-y-0 pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-0.5">
                            <CardTitle className="text-base">Filters</CardTitle>
                            <CardDescription>
                                Narrow results by employee, department, type, and status.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {hasActiveFilters && (
                                <Button variant="outline" size="sm" onClick={clearFilters}>
                                    <X className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="min-w-64 flex-1">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email..."
                            value={search}
                            onChange={handleSearch}
                            className="pl-8"
                        />
                    </div>
                </div>

                <Select value={departmentId} onValueChange={handleDepartmentChange}>
                    <SelectTrigger className="w-56">
                        <SelectValue placeholder="Department" />
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

                <EmployeeCombobox
                    className="w-64"
                    value={employeeId}
                    onValueChange={handleEmployeeChange}
                    allLabel="All Employees"
                    options={(employees ?? []).map((emp) => ({
                        value: emp.userId || "",
                        label: `${emp.firstName} ${emp.lastName}`,
                        code: emp.employeeCode,
                        department: emp.department?.name,
                    }))}
                />

                <Select
                    value={breakTypeFilter}
                    onValueChange={(val) => {
                        setBreakTypeFilter(val);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Break Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.values(BreakType).map((type) => (
                            <SelectItem key={type} value={type}>
                                {getBreakTypeIcon(type)} {getBreakTypeLabel(type)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                        setStatusFilter(val);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Active</SelectItem>
                        <SelectItem value="closed">Completed</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={limit.toString()}
                    onValueChange={(val) => {
                        setLimit(Number(val));
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Limit" />
                    </SelectTrigger>
                    <SelectContent>
                        {LIMITS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                    </div>

                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span>Active filters:</span>
                            {search && (
                                <Badge variant="secondary" className="font-normal">
                                    Search: {search}
                                </Badge>
                            )}
                            {departmentId !== "all" && (
                                <Badge variant="secondary" className="font-normal">
                                    Department
                                </Badge>
                            )}
                            {employeeId !== "all" && (
                                <Badge variant="secondary" className="font-normal">
                                    Employee
                                </Badge>
                            )}
                            {breakTypeFilter !== "all" && (
                                <Badge variant="secondary" className="font-normal">
                                    Type: {getBreakTypeLabel(breakTypeFilter as BreakType)}
                                </Badge>
                            )}
                            {statusFilter !== "all" && (
                                <Badge variant="secondary" className="font-normal">
                                    Status: {statusFilter === "open" ? "Active" : "Completed"}
                                </Badge>
                            )}
                            <Badge variant="secondary" className="font-normal">
                                Range: {dateRange.startDate} → {dateRange.endDate}
                            </Badge>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-0.5">
                            <CardTitle className="text-base">Break records</CardTitle>
                            <CardDescription>
                                Review break start/end times, duration, and status.
                            </CardDescription>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {breaksData?.meta?.total != null ? (
                                <span>
                                    {breaksData.meta.total} total • Page {page} of{" "}
                                    {breaksData.meta.totalPages}
                                </span>
                            ) : (
                                <span />
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto border-t">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Start</TableHead>
                                    <TableHead>End</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-12 text-right"> </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 8 }).map((_, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="h-8 w-8 rounded-full" />
                                                    <div className="space-y-1">
                                                        <Skeleton className="h-4 w-36" />
                                                        <Skeleton className="h-3 w-24" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-28" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-20" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-16" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-16" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-16" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-20" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-6 w-20" />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Skeleton className="ml-auto h-8 w-8" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : !breaksData?.data || breaksData.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-10">
                                            <div className="flex flex-col items-center justify-center gap-2 text-center">
                                                <Coffee className="h-6 w-6 text-muted-foreground" />
                                                <div className="text-sm font-medium">
                                                    No breaks found
                                                </div>
                                                <div className="max-w-md text-sm text-muted-foreground">
                                                    Try changing the date range or clearing filters to
                                                    see more results.
                                                </div>
                                                <div className="flex items-center gap-2 pt-2">
                                                    {hasActiveFilters && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={clearFilters}
                                                        >
                                                            Reset filters
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setCreateDialogOpen(true)}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Create break
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    breaksData.data.map((breakRecord) => (
                                        <TableRow key={breakRecord.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage
                                                            src={
                                                                breakRecord.user.employee
                                                                    ?.profilePicture || undefined
                                                            }
                                                        />
                                                        <AvatarFallback>
                                                            {breakRecord.user.name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium">
                                                            {breakRecord.user.name}
                                                        </div>
                                                        <div className="truncate text-xs text-muted-foreground">
                                                            {breakRecord.user.employee?.employeeCode ||
                                                                "—"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {breakRecord.user.employee?.department?.name || "—"}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(
                                                    breakRecord.startTime
                                                ).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>{formatTime(breakRecord.startTime)}</TableCell>
                                            <TableCell>
                                                {breakRecord.endTime ? (
                                                    formatTime(breakRecord.endTime)
                                                ) : (
                                                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                                                        Active
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {breakRecord.durationMinutes
                                                    ? formatBreakDuration(breakRecord.durationMinutes)
                                                    : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-muted-foreground">
                                                        {getBreakTypeIcon(breakRecord.breakType)}
                                                    </span>
                                                    <span className="text-sm">
                                                        {getBreakTypeLabel(breakRecord.breakType)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {breakRecord.endTime ? (
                                                    <Badge variant="secondary">Completed</Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                                                        Active
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                        </TooltipTrigger>
                                                        <TooltipContent sideOffset={6}>
                                                            Actions
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => handleEdit(breakRecord)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onClick={() => handleDelete(breakRecord)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {breaksData?.meta && breaksData.meta.totalPages > 1 && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {(page - 1) * limit + 1} to{" "}
                        {Math.min(page * limit, breaksData.meta.total)} of{" "}
                        {breaksData.meta.total} breaks
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <div className="text-sm">
                            Page {page} of {breaksData.meta.totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= breaksData.meta.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Dialogs */}
            <BreakDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                mode="create"
            />

            {selectedBreak && (
                <BreakDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    mode="edit"
                    breakData={selectedBreak}
                />
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this break record. This action cannot
                            be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
