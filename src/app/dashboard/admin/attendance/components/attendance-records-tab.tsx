"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Edit, Trash2, ArrowLeft, ArrowRight, Calendar, CalendarDays, MapPin } from "lucide-react";
import { useAttendanceRecords, useUpdateAttendanceRecord, useDeleteAttendanceRecord } from "@/lib/queries/attendance";
import { useDepartments } from "@/lib/queries/departments";
import { useEmployees } from "@/lib/queries/employees";
import { toStartOfDayISO, toEndOfDayISO, formatTimeInTimezone, formatDateInTimezone } from "@/lib/utils";
import { useDateRangePresets, DATE_RANGE_PRESETS } from "@/hooks/useDateRangePresets";
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
const LIMITS = [10, 30, 50, 100];
const LIMITS_OPTIONS = LIMITS.map((limit) => ({
    label: limit.toString(),
    value: limit.toString(),
}));
export function AttendanceRecordsTab() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState<string>("all");
    const [employeeId, setEmployeeId] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all"); // "all", "late", "ontime", "absent", "onleave"
    const [limit, setLimit] = useState(30);
    // Use date range presets hook
    const { preset, dateRange, setPreset, setCustomRange } = useDateRangePresets("today");

    const { data: departments } = useDepartments();
    const { data: employees } = useEmployees();

    // Convert date range to ISO DateTime with user's timezone
    const queryParams = useMemo(() => ({
        page: page.toString(),
        limit: limit.toString(),
        search: search.trim() || undefined,
        departmentId: departmentId === "all" ? undefined : departmentId,
        userId: employeeId === "all" ? undefined : employeeId,
        startDate: toStartOfDayISO(dateRange.startDate),
        endDate: toEndOfDayISO(dateRange.endDate),
        isLate: statusFilter === "late" ? true : statusFilter === "ontime" ? false : undefined,
    }), [page, limit, search, departmentId, employeeId, dateRange.startDate, dateRange.endDate, statusFilter]);

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



    return (
        <>
            <div className="space-y-4">


                {/* Date Range Quick Filters */}
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
                                        value={dateRange.startDate}
                                        max={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => setCustomRange({ startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="date"
                                        value={dateRange.endDate}
                                        max={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => setCustomRange({ endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4 shadow-sm">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, code..."
                                value={search}
                                onChange={handleSearch}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    <Select value={departmentId} onValueChange={handleDepartmentChange}>
                        <SelectTrigger >
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
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Employee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {employees?.map((emp) => (
                                <SelectItem key={emp.userId} value={emp.userId || ""}>
                                    {emp.name} ({emp.employeeCode})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                        <SelectTrigger >
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
                    <Select value={limit.toString()} onValueChange={(val) => {
                        setLimit(Number(val));
                        setPage(1);
                    }}>
                        <SelectTrigger >
                            <SelectValue placeholder="Limit" />
                        </SelectTrigger>
                        <SelectContent>
                            {LIMITS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
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
                                <TableHead>Sign In</TableHead>
                                <TableHead>Sign Out</TableHead>
                                <TableHead>Lost Time</TableHead>
                                <TableHead>Overtime</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        No records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRecords.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={record.user.employee?.profilePicture || undefined} />
                                                    <AvatarFallback>{record.user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <Link
                                                        href={`/dashboard/admin/employees/${record.user.employee?.id}`}
                                                        className="font-medium text-primary hover:underline"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {record.user.name}
                                                    </Link>
                                                    <span className="text-xs text-muted-foreground">{record.user.employee?.employeeCode}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{record.user.employee?.department?.name || "—"}</TableCell>
                                        <TableCell>{formatDateInTimezone(record.date, "long")}</TableCell>
                                        <TableCell>{formatTime(record.signIn)}</TableCell>
                                        <TableCell>{formatTime(record.signOut)}</TableCell>

                                        <TableCell>
                                            {record.lostMinutes != null ? `${record.lostMinutes} mins` : "—"}
                                        </TableCell>
                                        <TableCell>
                                            {record.overtimeMinutes != null ? `${record.overtimeMinutes} mins` : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {!record.signIn ? (
                                                    record.isWeekend ? (
                                                        <Badge variant="outline" className="border-gray-200 text-gray-700 bg-gray-50">
                                                            Weekend
                                                        </Badge>
                                                    ) : record.isOnLeave ? (
                                                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                                                            <CalendarDays className="mr-1 h-3 w-3" />
                                                            On Leave
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">Absent</Badge>
                                                    )
                                                ) : record.isLate ? (
                                                    <Badge variant="destructive">Late</Badge>
                                                ) : (
                                                    <Badge variant="secondary">On Time</Badge>
                                                )}
                                                {record.isOnLeave && record.leave && (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs text-muted-foreground">
                                                            {record.leave.leaveType.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatTimeInTimezone(record.leave.startDate, false)}
                                                            {record.leave.startDate !== record.leave.endDate && (
                                                                <> - {formatTimeInTimezone(record.leave.endDate, false)}</>
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSelectedEmployee({
                                                        userId: record.user.id,
                                                        name: record.user.name,
                                                        record: record
                                                    })}
                                                    title="View leave balance"
                                                >
                                                    <Info className="h-4 w-4" />
                                                </Button>
                                                {record.signIn && <EditRecordDialog record={record} />}
                                                {
                                                    record.signIn && <DeleteRecordDialog record={record} />
                                                }
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((old) => Math.max(old - 1, 1))}
                        disabled={page === 1 || isLoading}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                    </Button>
                    <div className="text-sm font-medium">
                        Page {page} of {recordsData?.totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((old) => old + 1)}
                        disabled={isLoading || !recordsData || recordsData.data.length < limit}
                    >
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
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
            console.log({signInIso, signOutIso});

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
