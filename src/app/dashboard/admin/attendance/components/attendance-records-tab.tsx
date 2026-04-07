"use client";

import { useState, useMemo } from "react";
import { Search, Edit, Trash2, ArrowLeft, ArrowRight, CalendarDays, MapPin, Loader2, CalendarRange, LayoutGrid, LogIn, LogOut } from "lucide-react";
import { useAttendanceRecords, useUpdateAttendanceRecord, useDeleteAttendanceRecord } from "@/lib/queries/attendance";
import { useDepartments } from "@/lib/queries/departments";
import { useEmployees } from "@/lib/queries/employees";
import { toStartOfDayISO, toEndOfDayISO, toLocalDateStr as toLocalStr, formatTimeInTimezone, formatDateInTimezone, formatMinutesToHours } from "@/lib/utils";
import { useDateRangePresets, DATE_RANGE_PRESETS, type DateRangePreset } from "@/hooks/useDateRangePresets";
import { useTimezone } from "@/contexts/timezone-context";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ExtendedAttendanceRecord } from "@/lib/api/attendance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { EmployeeLeaveBalanceDetails } from "@/components/employee-leave-balance-details";
import { Info } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { MonthlySummaryCard } from "./monthly-summary-card";
import { BreakMonitorCard } from "./break-monitor-card";
import { useReverseGeocode } from "@/hooks/use-reverse-geocode";
const LIMITS = [10, 30, 50, 100];
const LIMITS_OPTIONS = LIMITS.map((limit) => ({
    label: limit.toString(),
    value: limit.toString(),
}));
// ── Monthly mode helpers ────────────────────────────────────────
type FilterMode = "preset" | "monthly";

function currentMonthValue() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

function monthToRange(ym: string) {
    const [y, m] = ym.split("-").map(Number) as [number, number];
    const start = new Date(y, m - 1, 1);
    const end   = new Date(y, m, 0);
    return { startDate: toLocalStr(start), endDate: toLocalStr(end) };
}

export function AttendanceRecordsTab() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState<string>("all");
    const [employeeId, setEmployeeId] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [limit, setLimit] = useState(30);

    // Date filter
    const { preset, dateRange, setPreset, setCustomRange } = useDateRangePresets("today");
    const [filterMode, setFilterMode]         = useState<FilterMode>("preset");
    const [selectedMonth, setSelectedMonth]   = useState<string>(currentMonthValue);

    const effectiveDateRange = useMemo(() =>
        filterMode === "monthly" ? monthToRange(selectedMonth) : dateRange,
    [filterMode, selectedMonth, dateRange]);

    const maxMonth = currentMonthValue();

    const { data: departments } = useDepartments();
    const { data: employees } = useEmployees();

    const queryParams = useMemo(() => ({
        page: page.toString(),
        limit: limit.toString(),
        search: search.trim() || undefined,
        departmentId: departmentId === "all" ? undefined : departmentId,
        userId: employeeId === "all" ? undefined : employeeId,
        startDate: toStartOfDayISO(effectiveDateRange.startDate),
        endDate:   toEndOfDayISO(effectiveDateRange.endDate),
        isLate: statusFilter === "late" ? true : statusFilter === "ontime" ? false : undefined,
    }), [page, limit, search, departmentId, employeeId, effectiveDateRange.startDate, effectiveDateRange.endDate, statusFilter]);

    const { data: recordsData, isLoading } = useAttendanceRecords(queryParams);

    // Client-side filter for absent and on leave status (since backend doesn't have these filters)
    const filteredRecords = useMemo(() => {
        if (!recordsData?.data) return [];
        if (statusFilter === "absent") {
            return recordsData.data.filter(record => !record.signIn && !record.isOnLeave);
        }
        if (statusFilter === "onleave") {
            return recordsData.data.filter(record => record.isOnLeave === true);
        }
        return recordsData.data;
    }, [recordsData?.data, statusFilter]);

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

    const [selectedEmployee, setSelectedEmployee] = useState<{
        userId: string;
        name: string;
        record?: ExtendedAttendanceRecord;
    } | null>(null);

    // Extract year and month from date range for monthly summary
    const summaryYear = useMemo(() => {
        const date = new Date(dateRange.startDate);
        return date.getFullYear();
    }, [dateRange.startDate]);

    const summaryMonth = useMemo(() => {
        const date = new Date(dateRange.startDate);
        return date.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
    }, [dateRange.startDate]);



    // Month label for the monthly chip
    const monthLabel = useMemo(() => {
        const [y, m] = selectedMonth.split("-").map(Number) as [number, number];
        return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }, [selectedMonth]);

    return (
        <>
            <div className="space-y-4">

                {/* ── Date range card ── */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarRange className="size-4 text-muted-foreground" />
                            Date Range
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Pill strip */}
                        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {DATE_RANGE_PRESETS.map((opt) => {
                                const active = filterMode === "preset" && preset === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setFilterMode("preset"); setPreset(opt.value as DateRangePreset); setPage(1); }}
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

                            <div className="mx-1 self-stretch w-px bg-border shrink-0" />

                            {/* Monthly chip */}
                            <button
                                onClick={() => { setFilterMode("monthly"); setPage(1); }}
                                className={[
                                    "shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    filterMode === "monthly"
                                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                                ].join(" ")}
                            >
                                <LayoutGrid className="size-3 shrink-0" />
                                {filterMode === "monthly" ? monthLabel : "Monthly"}
                            </button>
                        </div>

                        {/* Monthly picker */}
                        {filterMode === "monthly" && (
                            <div className="flex items-end gap-3 rounded-lg border bg-muted/30 p-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Select month</label>
                                    <Input
                                        type="month"
                                        value={selectedMonth}
                                        max={maxMonth}
                                        className="h-8 w-44 text-sm"
                                        onChange={(e) => { if (e.target.value) { setSelectedMonth(e.target.value); setPage(1); } }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Custom date range */}
                        {filterMode === "preset" && preset === "custom" && (
                            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 sm:max-w-sm">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">From</label>
                                    <Input type="date" value={dateRange.startDate} max={new Date().toISOString().split("T")[0]} className="h-8 text-sm" onChange={(e) => { setCustomRange({ startDate: e.target.value }); setPage(1); }} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">To</label>
                                    <Input type="date" value={dateRange.endDate} max={new Date().toISOString().split("T")[0]} className="h-8 text-sm" onChange={(e) => { setCustomRange({ endDate: e.target.value }); setPage(1); }} />
                                </div>
                            </div>
                        )}

                        {/* Active range readout */}
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarRange className="size-3.5 shrink-0" />
                            <span className="font-medium text-foreground">
                                {effectiveDateRange.startDate === effectiveDateRange.endDate
                                    ? effectiveDateRange.startDate
                                    : `${effectiveDateRange.startDate} – ${effectiveDateRange.endDate}`}
                            </span>
                        </p>
                    </CardContent>
                </Card>

                {/* ── Filters bar ── */}
                <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search name, email, code…"
                            value={search}
                            onChange={handleSearch}
                            className="pl-8 h-9"
                        />
                    </div>

                    <Select value={departmentId} onValueChange={handleDepartmentChange}>
                        <SelectTrigger className="h-9 w-full sm:w-[160px]">
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={employeeId} onValueChange={handleEmployeeChange}>
                        <SelectTrigger className="h-9 w-full sm:w-[180px]">
                            <SelectValue placeholder="Employee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {employees?.map(emp => (
                                <SelectItem key={emp.userId} value={emp.userId || ""}>
                                    {emp.name} ({emp.employeeCode})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                        <SelectTrigger className="h-9 w-full sm:w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="ontime">On Time</SelectItem>
                            <SelectItem value="onleave">On Leave</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                        <SelectTrigger className="h-9 w-[90px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LIMITS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label} / page</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* ── Table ── */}
                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                <TableHead className="font-semibold">Employee</TableHead>
                                <TableHead className="font-semibold">Date</TableHead>
                                <TableHead className="font-semibold">
                                    <span className="flex items-center gap-1"><LogIn className="size-3.5" />In</span>
                                </TableHead>
                                <TableHead className="font-semibold">
                                    <span className="flex items-center gap-1"><LogOut className="size-3.5" />Out</span>
                                </TableHead>
                                <TableHead className="font-semibold hidden xl:table-cell">Location</TableHead>
                                <TableHead className="font-semibold text-right">Lost</TableHead>
                                <TableHead className="font-semibold text-right">OT</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                                        <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                                        Loading records…
                                    </TableCell>
                                </TableRow>
                            ) : filteredRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground text-sm">
                                        No records found for this period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRecords.map((record, idx) => {
                                    const rowBg = idx % 2 !== 0 ? "bg-muted/20" : "";
                                    const deptName = departments?.find(d => d.id === record.user.employee?.departmentId)?.name;
                                    return (
                                        <TableRow key={record.id} className={`${rowBg} hover:bg-muted/40 transition-colors`}>
                                            {/* Employee */}
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="size-8 shrink-0">
                                                        <AvatarImage src={record.user.employee?.profilePicture || undefined} />
                                                        <AvatarFallback className="text-xs">{record.user.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <Link href={`/dashboard/admin/employees/${record.user.employee?.id}`} className="font-medium hover:underline text-primary leading-tight">
                                                            {record.user.name}
                                                        </Link>
                                                        <span className="text-xs text-muted-foreground">{record.user.employee?.employeeCode}</span>
                                                        {deptName && <span className="text-xs text-muted-foreground">{deptName}</span>}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Date */}
                                            <TableCell className="whitespace-nowrap text-sm">
                                                {formatDateInTimezone(record.date, "medium")}
                                            </TableCell>

                                            {/* Sign in */}
                                            <TableCell>
                                                <span className={`tabular-nums font-medium ${record.isLate ? "text-amber-600 dark:text-amber-400" : ""}`}>
                                                    {record.signIn ? formatTime(record.signIn) : <span className="text-muted-foreground">—</span>}
                                                </span>
                                            </TableCell>

                                            {/* Sign out */}
                                            <TableCell>
                                                <span className="tabular-nums text-muted-foreground">
                                                    {record.signOut ? formatTime(record.signOut) : "—"}
                                                </span>
                                            </TableCell>

                                            {/* Location */}
                                            <RecordsLocationCell record={record} />

                                            {/* Lost */}
                                            <TableCell className="text-right tabular-nums">
                                                {record.lostMinutes != null && record.lostMinutes > 0
                                                    ? <span className="font-semibold text-red-600 dark:text-red-400">{formatMinutesToHours(record.lostMinutes)}</span>
                                                    : <span className="text-muted-foreground">—</span>}
                                            </TableCell>

                                            {/* OT */}
                                            <TableCell className="text-right tabular-nums">
                                                {record.overtimeMinutes != null && record.overtimeMinutes > 0
                                                    ? <span className="font-semibold text-emerald-700 dark:text-emerald-400">+{formatMinutesToHours(record.overtimeMinutes)}</span>
                                                    : <span className="text-muted-foreground">—</span>}
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {!record.signIn ? (
                                                        record.isWeekend ? (
                                                            <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-500 dark:bg-slate-900/40 text-xs">Weekend</Badge>
                                                        ) : record.isOnLeave ? (
                                                            <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 text-xs">
                                                                <CalendarDays className="mr-1 size-3" />
                                                                {record.leave?.leaveType.name ?? "On Leave"}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="border-red-300 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 text-xs">Absent</Badge>
                                                        )
                                                    ) : record.isLate ? (
                                                        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 text-xs">Late</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-xs">On Time</Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="size-8"
                                                        onClick={() => setSelectedEmployee({ userId: record.user.id, name: record.user.name, record })}
                                                        title="View employee details"
                                                    >
                                                        <Info className="size-4" />
                                                    </Button>
                                                    {record.signIn && <EditRecordDialog record={record} />}
                                                    {record.signIn && <DeleteRecordDialog record={record} />}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* ── Pagination ── */}
                <div className="flex items-center justify-between py-2">
                    <p className="text-sm text-muted-foreground">
                        Page {page}{recordsData?.totalPages ? ` of ${recordsData.totalPages}` : ""}
                        {recordsData?.total ? ` · ${recordsData.total} total records` : ""}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1 || isLoading}>
                            <ArrowLeft className="mr-1.5 size-4" /> Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={isLoading || !recordsData || recordsData.data.length < limit}>
                            Next <ArrowRight className="ml-1.5 size-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Employee Details Sheet */}
            <Sheet open={!!selectedEmployee} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
                <SheetContent className="w-full max-w-4xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Employee Details</SheetTitle>
                        <SheetDescription>
                            {selectedEmployee?.name}'s comprehensive attendance and leave information
                        </SheetDescription>
                    </SheetHeader>
                    {selectedEmployee && (
                        <div className="mt-6 space-y-6">
                            {/* Monthly Attendance Summary for Employee */}
                            <MonthlySummaryCard
                                year={summaryYear}
                                month={summaryMonth}
                                userId={selectedEmployee.userId}
                            />

                            {/* Attendance Information */}
                            {selectedEmployee.record && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Attendance Information</CardTitle>
                                        <CardDescription>Location and time details for this attendance record</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-sm font-medium text-muted-foreground mb-2">Sign In</div>
                                                <div className="space-y-2">
                                                    <div className="text-sm">{formatTime(selectedEmployee.record.signIn)}</div>
                                                    {selectedEmployee.record.signInAddress && (
                                                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                                            <MapPin className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                                            <span>{selectedEmployee.record.signInAddress}</span>
                                                        </div>
                                                    )}
                                                    {selectedEmployee.record.signInLocation && !selectedEmployee.record.signInAddress && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <MapPin className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                                                            <span>{selectedEmployee.record.signInLocation}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-muted-foreground mb-2">Sign Out</div>
                                                <div className="space-y-2">
                                                    <div className="text-sm">{formatTime(selectedEmployee.record.signOut) || "—"}</div>
                                                    {selectedEmployee.record.signOutAddress && (
                                                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                                            <MapPin className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                                                            <span>{selectedEmployee.record.signOutAddress}</span>
                                                        </div>
                                                    )}
                                                    {selectedEmployee.record.signOutLocation && !selectedEmployee.record.signOutAddress && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <MapPin className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                                                            <span>{selectedEmployee.record.signOutLocation}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Time Metrics */}
                                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                            <div>
                                                <div className="text-sm font-medium text-muted-foreground mb-1">Lost Time</div>
                                                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                                                    {selectedEmployee.record.lostMinutes != null
                                                        ? `${Math.floor(selectedEmployee.record.lostMinutes / 60)}h ${selectedEmployee.record.lostMinutes % 60}m`
                                                        : "—"}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-muted-foreground mb-1">Overtime</div>
                                                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                                    {selectedEmployee.record.overtimeMinutes != null
                                                        ? `${Math.floor(selectedEmployee.record.overtimeMinutes / 60)}h ${selectedEmployee.record.overtimeMinutes % 60}m`
                                                        : "—"}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-muted-foreground mb-1">Worked</div>
                                                <div className="text-lg font-semibold">
                                                    {selectedEmployee.record.workedMinutes != null
                                                        ? `${Math.floor(selectedEmployee.record.workedMinutes / 60)}h ${selectedEmployee.record.workedMinutes % 60}m`
                                                        : "—"}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Break Monitoring - Only show if there's an attendance record with sign-in */}
                            {selectedEmployee.record?.signIn && (
                                <BreakMonitorCard
                                    attendanceId={selectedEmployee.record.id}
                                    employeeName={selectedEmployee.name}
                                    signInTime={selectedEmployee.record.signIn}
                                    signOutTime={selectedEmployee.record.signOut}
                                />
                            )}

                            {/* Leave Balance Details */}
                            <EmployeeLeaveBalanceDetails
                                userId={selectedEmployee.userId}
                                employeeName={selectedEmployee.name}
                            />
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}

function RecordsLocationCell({ record }: { record: ExtendedAttendanceRecord }) {
    const lat = record.signInLatitude ?? record.signOutLatitude;
    const lng = record.signInLongitude ?? record.signOutLongitude;

    // On-demand: don't auto-fetch, only when admin clicks
    const { data: geocodedAddress, isFetching, refetch } = useReverseGeocode(
        lat,
        lng,
        false,
    );

    const effectiveAddress =
        record.signInAddress ||
        record.signOutAddress ||
        record.signInLocation ||
        record.signOutLocation ||
        geocodedAddress ||
        null;

    const hasLatLng = lat != null && lng != null;

    return (
        <TableCell className="max-w-xs">
            {effectiveAddress ? (
                <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span
                        className="text-xs text-muted-foreground truncate"
                        title={effectiveAddress}
                    >
                        {effectiveAddress}
                    </span>
                </div>
            ) : hasLatLng ? (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={isFetching}
                    onClick={() => {
                        if (!isFetching) {
                            void refetch();
                        }
                    }}
                >
                    {isFetching ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                        <MapPin className="mr-1 h-3 w-3" />
                    )}
                    Fetch address
                </Button>
            ) : (
                <span className="text-xs text-muted-foreground">—</span>
            )}
        </TableCell>
    );
}

function formatTime(isoString?: string | null) {
    return formatTimeInTimezone(isoString || "");
}

function EditRecordDialog({ record }: { record: ExtendedAttendanceRecord }) {
    const [open, setOpen] = useState(false);
    const { timezone: systemTimezone } = useTimezone();
    // Prefer the record's stored timezone if present, fallback to system timezone
    const recordTimezone = record.timezone || systemTimezone;
    const updateMutation = useUpdateAttendanceRecord();

    // Convert UTC times from DB to record's timezone for input fields
    const getLocalTime = (utcIsoString?: string | null): string => {
        if (!utcIsoString) return "";
        const date = new Date(utcIsoString);
        // Format as HH:MM in record's timezone
        return date.toLocaleTimeString("en-US", {
            timeZone: recordTimezone,
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
        });
    };


    const [signIn, setSignIn] = useState(getLocalTime(record.signIn));
    const [signOut, setSignOut] = useState(getLocalTime(record.signOut));
    const [isLate, setIsLate] = useState(record.isLate);

    const handleSave = async () => {
        try {
            // Validate sign-in is provided
            if (!signIn) {
                toast.error("Sign-in time is required");
                return;
            }
            // Simple helper: Convert local time (HH:MM in record's timezone) to UTC ISO string
            // record.date is UTC representing local midnight in record's timezone
            const localTimeToUTC = (timeStr: string, baseDate: Date): string => {
                const [hours, minutes] = timeStr.split(":").map(Number);

                // Get date components from baseDate in record's timezone
                const dateFormatter = new Intl.DateTimeFormat("en-CA", {
                    timeZone: recordTimezone,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                });
                const datePart = dateFormatter.format(baseDate);
                const [year, month, day] = datePart.split("-").map(Number);

                // Create ISO string for the local time, then find UTC equivalent
                // Use iterative approach: start with approximate UTC, adjust until correct
                let testUTC = new Date(Date.UTC(year, month - 1, day, hours - 6, minutes, 0)); // Initial guess: -6 hours for Asia/Dhaka

                const formatter = new Intl.DateTimeFormat("en-US", {
                    timeZone: recordTimezone,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                });

                // Quick adjustment (usually converges in 1-2 iterations)
                for (let i = 0; i < 3; i++) {
                    const parts = formatter.formatToParts(testUTC);
                    const localHour = parseInt(parts.find(p => p.type === "hour")?.value || "0");
                    const localMin = parseInt(parts.find(p => p.type === "minute")?.value || "0");
                    const localDay = parseInt(parts.find(p => p.type === "day")?.value || "0");

                    if (localHour === hours && localMin === minutes && localDay === day) {
                        return testUTC.toISOString();
                    }

                    // Adjust by the difference
                    const diffMinutes = (hours - localHour) * 60 + (minutes - localMin) + (day - localDay) * 24 * 60;
                    testUTC = new Date(testUTC.getTime() + diffMinutes * 60 * 1000);
                }

                return testUTC.toISOString();
            };

            // Convert times to UTC ISO strings
            const signInIso = localTimeToUTC(signIn, new Date(record.date));

            let signOutIso: string | null = null;
            if (signOut) {
                const [signOutHour] = signOut.split(":").map(Number);
                signOutIso = localTimeToUTC(signOut, new Date(record.date));

                const signOutDate = new Date(signOutIso);
                const signInDate = new Date(signInIso);

                // Handle night shift (sign-out on next day if before 8 AM and before sign-in)
                if (signOutDate <= signInDate && signOutHour < 8) {
                    const nextDay = new Date(record.date);
                    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
                    signOutIso = localTimeToUTC(signOut, nextDay);
                } else if (signOutDate <= signInDate) {
                    toast.error("Sign-out time must be after sign-in time");
                    return;
                }

                // Validate 24-hour limit
                const diffMinutes = (new Date(signOutIso).getTime() - signInDate.getTime()) / (1000 * 60);
                if (diffMinutes > 24 * 60) {
                    toast.error("Sign-out time cannot be more than 24 hours after sign-in");
                    return;
                }
            }
            console.log({ signInIso, signOutIso });

            await updateMutation.mutateAsync({
                id: record.id,
                payload: {
                    signIn: signInIso,
                    signOut: signOutIso,
                    isLate
                }
            });
            toast.success("Record updated");
            setOpen(false);
        } catch (e: any) {
            console.error(e);
            const errorMessage = e?.response?.data?.message || e?.message || "Failed to update record";
            toast.error(errorMessage);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Attendance</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Sign In</Label>
                        <Input type="time" value={signIn} onChange={(e) => setSignIn(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Sign Out</Label>
                        <Input type="time" value={signOut} onChange={(e) => setSignOut(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <div className="text-right">Is Late</div>
                        <Checkbox checked={isLate} onCheckedChange={(c) => setIsLate(!!c)} />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
function DeleteRecordDialog({ record }: { record: ExtendedAttendanceRecord }) {
    const deleteMutation = useDeleteAttendanceRecord();

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync(record.id);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete the attendance record for {record.user.name} on {formatTimeInTimezone(record.date, false)}? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
