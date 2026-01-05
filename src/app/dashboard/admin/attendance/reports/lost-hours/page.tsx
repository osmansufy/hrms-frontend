"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLostHoursReport } from "@/lib/queries/attendance";
import { toStartOfDayISO, toEndOfDayISO, formatMinutesToHours } from "@/lib/utils";
import { useDateRangePresets, DATE_RANGE_PRESETS } from "@/hooks/useDateRangePresets";
import { Calendar, Download } from "lucide-react";
import { formatDateInDhaka } from "@/lib/utils";
export default function LostHoursReportPage() {
    const router = useRouter();
    const { preset, dateRange, setPreset, setCustomRange } = useDateRangePresets("this-month");

    // Convert date strings to ISO DateTime with user's timezone
    const queryParams = useMemo(() => ({
        startDate: toStartOfDayISO(dateRange.startDate),
        endDate: toEndOfDayISO(dateRange.endDate),
        departmentId: undefined // Can be extended later
    }), [dateRange.startDate, dateRange.endDate]);

    const { data, refetch, isFetching } = useLostHoursReport(queryParams);

    const totalLost = useMemo(() => (data || []).reduce((s, r) => s + (r.totalLostMinutes || 0), 0), [data]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} title="Back">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-semibold">Lost Hours Report</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Date Range Filters
                    </CardTitle>
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
                                    onChange={(e) => setCustomRange({ startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">End Date</label>
                                <Input
                                    type="date"
                                    value={dateRange.endDate}
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
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => refetch()}
                            disabled={isFetching}
                        >
                            {isFetching ? "Loading..." : "Refresh"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Lost Hours Summary</span>
                        <div className="text-sm font-normal text-muted-foreground">
                            {data?.length || 0} employees
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Lost Hours</div>
                        <div className="text-2xl font-bold text-red-600">
                            {formatMinutesToHours(totalLost)}
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead>Worked</TableHead>
                                <TableHead>Lost</TableHead>
                                <TableHead>Overtime</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isFetching ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Loading...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : data?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No attendance data found for the selected period
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.map((row) => (
                                    <TableRow key={row.userId}>
                                        <TableCell className="font-medium">{row.name}</TableCell>
                                        <TableCell>{row.days}</TableCell>
                                        <TableCell>{formatMinutesToHours(row.totalWorkedMinutes || 0)}</TableCell>
                                        <TableCell className="text-red-600 font-semibold">
                                            {formatMinutesToHours(row.totalLostMinutes || 0)}
                                        </TableCell>
                                        <TableCell className="text-green-700 font-semibold">
                                            {formatMinutesToHours(row.totalOvertimeMinutes || 0)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div >
    );
}
