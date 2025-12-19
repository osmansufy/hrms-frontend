"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTodayAttendanceForAdmin } from "@/lib/queries/attendance";
import { listEmployees } from "@/lib/api/employees";

function formatTime(value?: string | null) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "—";
    }
}

const TodayAttendance = () => {
    const { data, isLoading, isError, isFetching } = useTodayAttendanceForAdmin();
    const {
        data: employees,
        isLoading: employeesLoading,
    } = useQuery({
        queryKey: ["employees", "attendance", "today"],
        queryFn: () => listEmployees(),
        staleTime: 60_000,
    });

    const usersById = useMemo(() => {
        const map: Record<string, { name?: string; email?: string }> = {};
        (employees ?? []).forEach((emp) => {
            map[emp.userId] = {
                name: [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.user?.email,
                email: emp.personalEmail || emp.user?.email,
            };
        });
        return map;
    }, [employees]);

    const records = data ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Today&apos;s Attendance</CardTitle>
                <CardDescription>Snapshot of who has signed in today.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading || employeesLoading ? (
                    <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <Loader2 className="mr-2 size-5 animate-spin" />
                        Loading today&apos;s attendance...
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center space-y-2 py-10 text-muted-foreground">
                        <AlertCircle className="size-8" />
                        <p className="text-sm font-medium">Unable to load attendance</p>
                        <p className="text-xs">Check your connection and try again.</p>
                    </div>
                ) : records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-3 py-10 text-muted-foreground">
                        <CheckCircle2 className="size-8" />
                        <p className="text-sm font-medium">No attendance recorded yet today</p>
                        <p className="text-xs text-center">Sign-ins will appear here as they happen.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Sign in</TableHead>
                                <TableHead>Sign out</TableHead>
                                <TableHead>In location</TableHead>
                                <TableHead>Out location</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.map((record) => {
                                const user = usersById[record.userId];
                                const status = record.signOut ? "Signed out" : "Signed in";
                                return (
                                    <TableRow key={record.id} className={isFetching ? "opacity-90" : undefined}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{user?.name || "—"}</span>
                                                <span className="text-xs text-muted-foreground">{record.userId}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{user?.email || "—"}</TableCell>
                                        <TableCell>
                                            <Badge variant={record.isLate ? "destructive" : "secondary"}>{status}</Badge>
                                        </TableCell>
                                        <TableCell>{formatTime(record.signIn)}</TableCell>
                                        <TableCell>{formatTime(record.signOut)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{record.signInLocation || "—"}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{record.signOutLocation || "—"}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default TodayAttendance;