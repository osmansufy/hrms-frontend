"use client";

import { useState, useMemo, use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { useAttendanceRecords, useMyAttendanceRecords } from "@/lib/queries/attendance";
import { toStartOfDayISO, toEndOfDayISO } from "@/lib/utils";

import { formatTimeInDhaka, formatDateInDhaka } from "@/lib/utils";

function formatTime(value?: string | null) {
    return formatTimeInDhaka(value || "");
}

function formatDate(value?: string | null) {
    return formatDateInDhaka(value || "", "long");
}

export function AttendanceHistoryTab() {
    const { session } = useSession();
    const userId = session?.user.id;

    const [page, setPage] = useState(1);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
        end: new Date().toISOString().split("T")[0],
    });

    // Convert date range to ISO DateTime with user's timezone
    const queryParams = useMemo(() => ({
        startDate: toStartOfDayISO(dateRange.start),
        endDate: toEndOfDayISO(dateRange.end),
        page: page.toString(),
        limit: "10",
    }), [dateRange.start, dateRange.end, page]);
    const { data, isLoading } = useMyAttendanceRecords(userId, queryParams);

    const records = data?.data || [];
    const totalPages = data?.totalPages || 1;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>View your past attendance records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Date Range Filter */}
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-muted-foreground">Date Range:</span>
                    <Input
                        type="date"
                        value={dateRange.start}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-auto"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                        type="date"
                        value={dateRange.end}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-auto"
                    />
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <Loader2 className="mr-2 size-5 animate-spin" />
                        Loading records...
                    </div>
                ) : records.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        No attendance records found for this period.
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Sign In</TableHead>
                                        <TableHead>Sign Out</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Location</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">
                                                {formatDate(record.date)}
                                            </TableCell>
                                            <TableCell>{formatTime(record.signIn)}</TableCell>
                                            <TableCell>{formatTime(record.signOut)}</TableCell>
                                            <TableCell>
                                                {!record.signIn ? (
                                                    record.isWeekend ? (
                                                        <Badge variant="outline" className="border-gray-200 text-gray-700 bg-gray-50">
                                                            Weekend
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                                                            Absent
                                                        </Badge>
                                                    )
                                                ) : record.isLate ? (
                                                    <Badge variant="destructive">Late</Badge>
                                                ) : (
                                                    <Badge variant="secondary">On Time</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {record.signInLocation || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
