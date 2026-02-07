"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Calendar,
    Search,
    Plus,
    Pencil,
    Trash2,
    Filter,
    Download,
    User,
    Clock,
    Coffee,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

// Date range presets
const DATE_RANGE_PRESETS = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "This Week", value: "this-week" },
    { label: "Last Week", value: "last-week" },
    { label: "This Month", value: "this-month" },
    { label: "Last Month", value: "last-month" },
    { label: "Last 7 Days", value: "last-7-days" },
    { label: "Custom", value: "custom" },
];

const LIMITS_OPTIONS = [
    { label: "10 per page", value: "10" },
    { label: "30 per page", value: "30" },
    { label: "50 per page", value: "50" },
    { label: "100 per page", value: "100" },
];

export default function BreaksManagementPage() {
    const queryClient = useQueryClient();

    // Filter states
    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState("all");
    const [employeeId, setEmployeeId] = useState("all");
    const [breakTypeFilter, setBreakTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(30);

    // Date range
    const [preset, setPreset] = useState("today");
    const [customRange, setCustomRange] = useState({
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
    });

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedBreak, setSelectedBreak] =
        useState<AttendanceBreakWithUser | null>(null);

    // Calculate date range based on preset
    const dateRange = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (preset) {
            case "today":
                return {
                    startDate: today.toISOString().split("T")[0],
                    endDate: today.toISOString().split("T")[0],
                };
            case "yesterday": {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return {
                    startDate: yesterday.toISOString().split("T")[0],
                    endDate: yesterday.toISOString().split("T")[0],
                };
            }
            case "this-week": {
                const firstDay = new Date(today);
                firstDay.setDate(today.getDate() - today.getDay());
                return {
                    startDate: firstDay.toISOString().split("T")[0],
                    endDate: today.toISOString().split("T")[0],
                };
            }
            case "last-week": {
                const firstDay = new Date(today);
                firstDay.setDate(today.getDate() - today.getDay() - 7);
                const lastDay = new Date(firstDay);
                lastDay.setDate(firstDay.getDate() + 6);
                return {
                    startDate: firstDay.toISOString().split("T")[0],
                    endDate: lastDay.toISOString().split("T")[0],
                };
            }
            case "this-month": {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                return {
                    startDate: firstDay.toISOString().split("T")[0],
                    endDate: today.toISOString().split("T")[0],
                };
            }
            case "last-month": {
                const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
                return {
                    startDate: firstDay.toISOString().split("T")[0],
                    endDate: lastDay.toISOString().split("T")[0],
                };
            }
            case "last-7-days": {
                const firstDay = new Date(today);
                firstDay.setDate(today.getDate() - 6);
                return {
                    startDate: firstDay.toISOString().split("T")[0],
                    endDate: today.toISOString().split("T")[0],
                };
            }
            case "custom":
                return customRange;
            default:
                return {
                    startDate: today.toISOString().split("T")[0],
                    endDate: today.toISOString().split("T")[0],
                };
        }
    }, [preset, customRange]);

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

    // Format date and time
    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
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

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Break Management
                    </h1>
                    <p className="text-muted-foreground">
                        Manage and monitor employee breaks
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Break
                </Button>
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
                            <CardTitle className="text-sm font-medium">Active Breaks</CardTitle>
                            <Clock className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.openBreaks}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Completed Breaks
                            </CardTitle>
                            <Clock className="h-4 w-4 text-blue-500" />
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
                            <Clock className="h-4 w-4 text-orange-500" />
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
                            <Clock className="h-4 w-4 text-purple-500" />
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
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="h-4 w-4" />
                        Date Range
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                        {DATE_RANGE_PRESETS.map((option) => (
                            <Button
                                key={option.value}
                                variant={preset === option.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPreset(option.value)}
                                className="w-full"
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>

                    {preset === "custom" && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <div>
                                <Input
                                    type="date"
                                    value={customRange.startDate}
                                    max={new Date().toISOString().split("T")[0]}
                                    onChange={(e) =>
                                        setCustomRange((prev) => ({
                                            ...prev,
                                            startDate: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <Input
                                    type="date"
                                    value={customRange.endDate}
                                    max={new Date().toISOString().split("T")[0]}
                                    onChange={(e) =>
                                        setCustomRange((prev) => ({
                                            ...prev,
                                            endDate: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4 shadow-sm">
                <div className="flex-1 min-w-50">
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
                    <SelectTrigger className="w-50">
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

                <Select value={employeeId} onValueChange={handleEmployeeChange}>
                    <SelectTrigger className="w-50">
                        <SelectValue placeholder="Employee" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employees?.map((emp) => (
                            <SelectItem key={emp.userId} value={emp.userId || ""}>
                                {emp.firstName} {emp.lastName} ({emp.employeeCode})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={breakTypeFilter}
                    onValueChange={(val) => {
                        setBreakTypeFilter(val);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-45">
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
                    <SelectTrigger className="w-37.5">
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
                    <SelectTrigger className="w-37.5">
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

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : !breaksData?.data || breaksData.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    No breaks found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            breaksData.data.map((breakRecord) => (
                                <TableRow key={breakRecord.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage
                                                    src={
                                                        breakRecord.user.employee?.profilePicture ||
                                                        undefined
                                                    }
                                                />
                                                <AvatarFallback>
                                                    {breakRecord.user.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">
                                                    {breakRecord.user.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {breakRecord.user.employee?.employeeCode}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {breakRecord.user.employee?.department?.name || "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(breakRecord.startTime).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{formatTime(breakRecord.startTime)}</TableCell>
                                    <TableCell>
                                        {breakRecord.endTime ? (
                                            formatTime(breakRecord.endTime)
                                        ) : (
                                            <Badge variant="outline" className="bg-green-50">
                                                Active
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {breakRecord.durationMinutes
                                            ? formatBreakDuration(breakRecord.durationMinutes)
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <span>{getBreakTypeIcon(breakRecord.breakType)}</span>
                                            <span className="text-sm">
                                                {getBreakTypeLabel(breakRecord.breakType)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {breakRecord.endTime ? (
                                            <Badge variant="secondary">Completed</Badge>
                                        ) : (
                                            <Badge variant="default" className="bg-green-500">
                                                Active
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(breakRecord)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(breakRecord)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {breaksData?.meta && breaksData.meta.totalPages > 1 && (
                <div className="flex items-center justify-between">
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
