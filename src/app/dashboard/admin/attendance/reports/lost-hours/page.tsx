"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLostHoursReport } from "@/lib/queries/attendance";

export default function LostHoursReportPage() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
    const [filters, setFilters] = useState({ startDate: startOfMonth, endDate: endOfMonth, departmentId: "" });
    const { data, refetch, isFetching } = useLostHoursReport({ startDate: filters.startDate, endDate: filters.endDate, departmentId: filters.departmentId || undefined });

    const totalLost = useMemo(() => (data || []).reduce((s, r) => s + (r.totalLostMinutes || 0), 0), [data]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Lost Hours Report</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div>
                        <label className="block text-sm mb-1">Start Date</label>
                        <Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">End Date</label>
                        <Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Department ID (optional)</label>
                        <Input value={filters.departmentId} onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })} placeholder="dept-uuid" />
                    </div>
                    <div className="flex items-end">
                        <Button onClick={() => refetch()} disabled={isFetching}>Apply</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Results</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-3 text-sm text-muted-foreground">Total Lost: {Math.round((totalLost || 0) / 60)} h</div>
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
                            {data?.map((row) => (
                                <TableRow key={row.userId}>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>{row.days}</TableCell>
                                    <TableCell>{Math.round((row.totalWorkedMinutes || 0) / 60)} h</TableCell>
                                    <TableCell className="text-red-600">{Math.round((row.totalLostMinutes || 0) / 60)} h</TableCell>
                                    <TableCell className="text-green-700">{Math.round((row.totalOvertimeMinutes || 0) / 60)} h</TableCell>
                                </TableRow>
                            ))}
                            {data?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">No data</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
