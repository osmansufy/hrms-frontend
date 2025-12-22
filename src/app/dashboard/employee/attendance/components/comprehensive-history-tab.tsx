"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { useMyLostHoursReport, useMyAttendanceRecords } from "@/lib/queries/attendance";
import { formatMinutesToHours, toStartOfDayISO, toEndOfDayISO } from "@/lib/utils";
import { useDateRangePresets, DATE_RANGE_PRESETS } from "@/hooks/useDateRangePresets";
import { Badge } from "@/components/ui/badge";

function formatTime(value?: string | null) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "—";
    }
}

function formatDate(value?: string | null) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    } catch {
        return "—";
    }
}

export function ComprehensiveHistoryTab() {
    const { session } = useSession();
    const userId = session?.user.id;

    const { preset, dateRange, setPreset, setCustomRange } = useDateRangePresets("today");

    // Convert date strings to ISO DateTime
    const queryParams = useMemo(() => ({
        startDate: toStartOfDayISO(dateRange.startDate),
        endDate: toEndOfDayISO(dateRange.endDate),
    }), [dateRange.startDate, dateRange.endDate]);

    const attendanceParams = useMemo(() => ({
        startDate: toStartOfDayISO(dateRange.startDate),
        endDate: toEndOfDayISO(dateRange.endDate),
        limit: "100",
    }), [dateRange.startDate, dateRange.endDate]);

    const { data: lostHoursData, isFetching: isLoadingLostHours } = useMyLostHoursReport(userId, queryParams);
    const { data: attendanceData, isLoading: isLoadingAttendance } = useMyAttendanceRecords(userId, attendanceParams);

    const myData = useMemo(() => lostHoursData?.find(r => r.userId === userId), [lostHoursData, userId]);
    const records = attendanceData?.data || [];

    // Calculate daily metrics from attendance records
    const dailyRecords = useMemo(() => {
        return records.map(record => {
            const signInTime = record.signIn ? new Date(record.signIn) : null;
            const signOutTime = record.signOut ? new Date(record.signOut) : null;

            let workedMinutes = 0;
            let lostMinutes = 0;
            let overtimeMinutes = 0;

            if (signInTime && signOutTime) {
                workedMinutes = Math.floor((signOutTime.getTime() - signInTime.getTime()) / 60000);

                // Assuming 8-hour workday (480 minutes)
                const expectedMinutes = 480;
                if (workedMinutes < expectedMinutes) {
                    lostMinutes = expectedMinutes - workedMinutes;
                } else if (workedMinutes > expectedMinutes) {
                    overtimeMinutes = workedMinutes - expectedMinutes;
                }
            } else if (signInTime && !signOutTime) {
                // Not signed out yet - consider as potential lost hours
                const now = new Date();
                const isToday = new Date(record.date).toDateString() === now.toDateString();
                if (!isToday) {
                    lostMinutes = 480; // Full day lost if not completed and not today
                }
            }

            return {
                ...record,
                workedMinutes,
                lostMinutes,
                overtimeMinutes,
            };
        });
    }, [records]);

    const isLoading = isLoadingLostHours || isLoadingAttendance;

    return (
        <div className="space-y-4">
            {/* Date Range Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Date Range Filters
                    </CardTitle>
                    <CardDescription>
                        Select a time period to view your attendance history and performance
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Quick Preset Filters */}
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

                    {/* Custom Date Range Inputs */}
                    {preset === "custom" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t">
                            <div>
                                <label className="block text-sm font-medium mb-1">Start Date</label>
                                <Input
                                    type="date"
                                    value={dateRange.startDate}
                                    max={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setCustomRange({ startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">End Date</label>
                                <Input
                                    type="date"
                                    value={dateRange.endDate}
                                    max={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setCustomRange({ endDate: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* Selected Range Display */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                        <span>
                            Showing: <strong>{new Date(dateRange.startDate).toLocaleDateString()}</strong> to{" "}
                            <strong>{new Date(dateRange.endDate).toLocaleDateString()}</strong>
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Days Worked</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <div className="text-2xl font-bold">{myData?.days || 0}</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Worked</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <div className="text-2xl font-bold">
                                {formatMinutesToHours(myData?.totalWorkedMinutes || 0)}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-red-200 dark:border-red-900/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Lost Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <div className="text-2xl font-bold text-red-600">
                                {formatMinutesToHours(myData?.totalLostMinutes || 0)}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-green-200 dark:border-green-900/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Overtime</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <div className="text-2xl font-bold text-green-700">
                                {formatMinutesToHours(myData?.totalOvertimeMinutes || 0)}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Comprehensive Attendance Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Records</CardTitle>
                    <CardDescription>
                        Complete breakdown of your attendance with work hours, lost hours, and overtime
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10 text-muted-foreground">
                            <Loader2 className="mr-2 size-5 animate-spin" />
                            Loading records...
                        </div>
                    ) : dailyRecords.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No attendance records found for this period.
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[120px]">Date</TableHead>
                                        <TableHead className="min-w-[80px]">Sign In</TableHead>
                                        <TableHead className="min-w-[80px]">Sign Out</TableHead>
                                        <TableHead className="min-w-[90px]">Status</TableHead>
                                        <TableHead className="min-w-[80px]">Worked</TableHead>
                                        <TableHead className="min-w-[80px] text-red-600">Lost</TableHead>
                                        <TableHead className="min-w-[80px] text-green-700">Overtime</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dailyRecords.map((record) => (
                                        <TableRow key={record.id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">
                                                {formatDate(record.date)}
                                            </TableCell>
                                            <TableCell>
                                                <span className={record.isLate ? "text-red-600 font-semibold" : ""}>
                                                    {formatTime(record.signIn)}
                                                </span>
                                            </TableCell>
                                            <TableCell>{formatTime(record.signOut)}</TableCell>
                                            <TableCell>
                                                {!record.signIn ? (
                                                    <Badge variant="outline" className="text-xs">Absent</Badge>
                                                ) : record.isLate ? (
                                                    <Badge variant="destructive" className="text-xs">Late</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        On Time
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {record.workedMinutes > 0 ? formatMinutesToHours(record.workedMinutes) : "—"}
                                            </TableCell>
                                            <TableCell>
                                                {record.lostMinutes > 0 ? (
                                                    <span className="font-semibold text-red-600">
                                                        {formatMinutesToHours(record.lostMinutes)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {record.overtimeMinutes > 0 ? (
                                                    <span className="font-semibold text-green-700">
                                                        {formatMinutesToHours(record.overtimeMinutes)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
