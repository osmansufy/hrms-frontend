"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clock, Search, Filter, X, CalendarDays, MapPin } from "lucide-react";
import { useAttendanceRecords } from "@/lib/queries/attendance";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toStartOfDayISO, toEndOfDayISO, formatTimeInTimezone } from "@/lib/utils";
import Link from "next/link";

function formatTime(value?: string | null) {
    return formatTimeInTimezone(value || "");
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

type FilterStatus = "all" | "present" | "signedOut" | "late" | "absent" | "onleave";

export function TodayAttendanceCard() {
    const today = new Date().toISOString().split("T")[0];
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

    const queryParams = useMemo(() => ({
        startDate: toStartOfDayISO(today),
        endDate: toEndOfDayISO(today),
        limit: "100", // Get all for today
    }), [today]);

    const { data, isLoading } = useAttendanceRecords(queryParams);

    const records = data?.data || [];

    // Extract unique departments
    const departments = useMemo(() => {
        const deptSet = new Set<string>();
        records.forEach(record => {
            const deptName = record.user?.employee?.department?.name;
            if (deptName) {
                deptSet.add(deptName);
            }
        });
        return Array.from(deptSet).sort();
    }, [records]);

    // Filter and search logic
    const filteredRecords = useMemo(() => {
        let filtered = [...records];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(record =>
                record.user?.name?.toLowerCase().includes(query) ||
                record.user?.employee?.employeeCode?.toLowerCase().includes(query) ||
                record.user?.employee?.department?.name?.toLowerCase().includes(query)
            );
        }

        // Apply department filter
        if (selectedDepartment !== "all") {
            filtered = filtered.filter(record =>
                record.user?.employee?.department?.name === selectedDepartment
            );
        }

        // Apply status filter
        if (filterStatus !== "all") {
            filtered = filtered.filter(record => {
                switch (filterStatus) {
                    case "present":
                        return record.signIn && !record.signOut;
                    case "signedOut":
                        return record.signIn && record.signOut;
                    case "late":
                        return record.isLate;
                    case "absent":
                        return !record.signIn && !record.isOnLeave;
                    case "onleave":
                        return record.isOnLeave === true;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, [records, searchQuery, selectedDepartment, filterStatus]);

    const present = records.filter(r => r.signIn && !r.signOut);
    const signedOut = records.filter(r => r.signIn && r.signOut);
    const late = records.filter(r => r.isLate);
    const onLeave = records.filter(r => r.isOnLeave === true);
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Today&apos;s Attendance</CardTitle>
                        <CardDescription>Real-time view of employee attendance</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatTimeInTimezone(new Date())}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <Loader2 className="mr-2 size-5 animate-spin" />
                        Loading today&apos;s attendance...
                    </div>
                ) : records.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        No attendance records for today yet.
                    </div>
                ) : (
                    <>
                        {/* Search and Filter Controls */}
                        <div className="flex flex-col gap-4 mb-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, employee code, or department..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-9"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger className="w-full sm:w-[200px]">
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept} value={dept}>
                                                {dept}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button
                                    variant={filterStatus === "all" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterStatus("all")}
                                    className="flex items-center gap-1"
                                >
                                    <Filter className="h-3 w-3" />
                                    All
                                </Button>
                                <Button
                                    variant={filterStatus === "present" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterStatus("present")}
                                >
                                    Present
                                </Button>
                                <Button
                                    variant={filterStatus === "signedOut" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterStatus("signedOut")}
                                >
                                    Signed Out
                                </Button>
                                <Button
                                    variant={filterStatus === "late" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterStatus("late")}
                                >
                                    Late
                                </Button>
                                <Button
                                    variant={filterStatus === "onleave" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterStatus("onleave")}
                                >
                                    <CalendarDays className="mr-1 h-3 w-3" />
                                    On Leave
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-muted-foreground">Present: {present.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                                    <span className="text-muted-foreground">Signed Out: {signedOut.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-red-500" />
                                    <span className="text-muted-foreground">Late: {late.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    <span className="text-muted-foreground">On Leave: {onLeave.length}</span>
                                </div>
                            </div>
                            {(searchQuery || filterStatus !== "all" || selectedDepartment !== "all") && (
                                <div className="text-sm text-muted-foreground">
                                    Showing {filteredRecords.length} of {records.length} records
                                </div>
                            )}
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Sign In</TableHead>
                                        <TableHead>Sign Out</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRecords.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                                No records found matching your search or filter criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredRecords.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell>
                                                <Link href={`/dashboard/admin/employees/${record.user?.employee?.employeeId}`}>

                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="text-xs">
                                                                {getInitials(record.user?.name || "?")}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">{record.user?.name}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {record.user?.employee?.employeeCode}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {record.user?.employee?.department?.name || "—"}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {formatTime(record.signIn)}
                                                </TableCell>
                                                <TableCell>
                                                    {formatTime(record.signOut)}
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    {(record.signInAddress || record.signInLocation || record.signOutAddress || record.signOutLocation) ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                            <span className="text-xs text-muted-foreground truncate" title={
                                                                [record.signInAddress, record.signOutAddress].filter(Boolean).join(" | ")
                                                            }>
                                                                {record.signInAddress || record.signInLocation || "Location"}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
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
                                                                <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                                                                    Absent
                                                                </Badge>
                                                            )
                                                        ) : record.signOut ? (
                                                            <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                                                                Signed Out
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                                                                Signed In
                                                            </Badge>
                                                        )}
                                                        {record.isLate && (
                                                            <Badge variant="destructive" className="ml-2">Late</Badge>
                                                        )}
                                                        {record.isOnLeave && record.leave && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {record.leave.leaveType.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
