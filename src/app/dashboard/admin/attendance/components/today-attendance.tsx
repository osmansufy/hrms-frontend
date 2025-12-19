"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock } from "lucide-react";
import { useAttendanceRecords } from "@/lib/queries/attendance";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function formatTime(value?: string | null) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "—";
    }
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function TodayAttendanceCard() {
    const today = new Date().toISOString().split("T")[0];

    const { data, isLoading } = useAttendanceRecords({
        startDate: today,
        endDate: today,
        limit: "100", // Get all for today
    });

    const records = data?.data || [];
    const present = records.filter(r => r.signIn && !r.signOut);
    const signedOut = records.filter(r => r.signIn && r.signOut);
    const late = records.filter(r => r.isLate);

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
                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                        <div className="flex gap-4 mb-4 text-sm">
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
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Sign In</TableHead>
                                        <TableHead>Sign Out</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>
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
                                            <TableCell>
                                                {!record.signOut ? (
                                                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                                                        Present
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">Signed Out</Badge>
                                                )}
                                                {record.isLate && (
                                                    <Badge variant="destructive" className="ml-2">Late</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
