"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { useMyLostHoursReport, useAttendanceRecords } from "@/lib/queries/attendance";
import { formatMinutesToHours, toStartOfDayISO, toEndOfDayISO } from "@/lib/utils";
import { useDateRangePresets, DATE_RANGE_PRESETS } from "@/hooks/useDateRangePresets";
import { Badge } from "@/components/ui/badge";

import { formatTimeInDhaka, formatDateInDhaka } from "@/lib/utils";

function formatTime(value?: string | null) {
    return formatTimeInDhaka(value || "");
}

function formatDate(value?: string | null) {
    return formatDateInDhaka(value || "", "short");
}

export function LostHoursTab() {
    const { session } = useSession();
    const userId = session?.user.id;

    const { preset, dateRange, setPreset, setCustomRange } = useDateRangePresets("this-month");

    // Convert date strings to ISO DateTime for lost hours summary
    const lostHoursParams = useMemo(() => ({
        startDate: toStartOfDayISO(dateRange.startDate),
        endDate: toEndOfDayISO(dateRange.endDate),
    }), [dateRange.startDate, dateRange.endDate]);

    // Get attendance records for detailed logs
    const attendanceParams = useMemo(() => ({
        userId,
        startDate: toStartOfDayISO(dateRange.startDate),
        endDate: toEndOfDayISO(dateRange.endDate),
        limit: "100",
    }), [userId, dateRange.startDate, dateRange.endDate]);

    const { data: lostHoursData, isFetching: isLoadingLostHours } = useMyLostHoursReport(userId, lostHoursParams);
    const { data: attendanceData, isLoading: isLoadingAttendance } = useAttendanceRecords(attendanceParams);

    const myData = useMemo(() => lostHoursData?.find(r => r.userId === userId), [lostHoursData, userId]);
    const records = attendanceData?.data || [];

    // Calculate daily lost hours from attendance records
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
                // Not signed out yet - consider as lost hours
                lostMinutes = 480; // Full day lost if not completed
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Date Range Filters
                    </CardTitle>
                    <CardDescription>
                        Select a time period to view your lost hours report
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
                            Showing: <strong>{formatDateInDhaka(dateRange.startDate, "long")}</strong> to{" "}
                            <strong>{formatDateInDhaka(dateRange.endDate, "long")}</strong>
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <div className="text-sm text-muted-foreground mb-1">Days Worked</div>
                                <div className="text-2xl font-bold">{myData?.days || 0}</div>
                            </div>
                            <div className="rounded-lg border bg-card p-4">
                                <div className="text-sm text-muted-foreground mb-1">Total Worked</div>
                                <div className="text-2xl font-bold">
                                    {formatMinutesToHours(myData?.totalWorkedMinutes || 0)}
                                </div>
                            </div>
                            <div className="rounded-lg border bg-red-50 dark:bg-red-950/20 p-4">
                                <div className="text-sm text-muted-foreground mb-1">Lost Hours</div>
                                <div className="text-2xl font-bold text-red-600">
                                    {formatMinutesToHours(myData?.totalLostMinutes || 0)}
                                </div>
                            </div>
                            <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4">
                                <div className="text-sm text-muted-foreground mb-1">Overtime</div>
                                <div className="text-2xl font-bold text-green-700">
                                    {formatMinutesToHours(myData?.totalOvertimeMinutes || 0)}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Daily Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daily Attendance Logs</CardTitle>
                    <CardDescription>
                        Detailed breakdown of your attendance for the selected period
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
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Sign In</TableHead>
                                        <TableHead>Sign Out</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Worked</TableHead>
                                        <TableHead className="text-red-600">Lost</TableHead>
                                        <TableHead className="text-green-700">Overtime</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dailyRecords.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">
                                                {formatDate(record.date)}
                                            </TableCell>
                                            <TableCell>{formatTime(record.signIn)}</TableCell>
                                            <TableCell>{formatTime(record.signOut)}</TableCell>
                                            <TableCell>
                                                {record.isLate ? (
                                                    <Badge variant="destructive" className="text-xs">Late</Badge>
                                                ) : record.signIn ? (
                                                    <Badge variant="secondary" className="text-xs">On Time</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs">Absent</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatMinutesToHours(record.workedMinutes)}
                                            </TableCell>
                                            <TableCell className="text-red-600 font-semibold">
                                                {record.lostMinutes > 0 ? formatMinutesToHours(record.lostMinutes) : "—"}
                                            </TableCell>
                                            <TableCell className="text-green-700 font-semibold">
                                                {record.overtimeMinutes > 0 ? formatMinutesToHours(record.overtimeMinutes) : "—"}
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
