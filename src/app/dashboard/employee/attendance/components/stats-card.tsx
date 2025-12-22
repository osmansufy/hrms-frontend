"use client";

import { useMemo } from "react";
import { Calendar, Clock, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/components/auth/session-provider";
import { useMyAttendanceRecords } from "@/lib/queries/attendance";
import { toStartOfDayISO, toEndOfDayISO } from "@/lib/utils";

export function AttendanceStatsCard() {
    const { session } = useSession();
    const userId = session?.user.id;

    // Get current month's attendance
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const queryParams = useMemo(() => ({
        startDate: toStartOfDayISO(startOfMonth.toISOString().split("T")[0]),
        endDate: toEndOfDayISO(endOfMonth.toISOString().split("T")[0]),
        limit: "100", // Get all records for the month
    }), []);

    const { data } = useMyAttendanceRecords(userId, queryParams);

    const stats = useMemo(() => {
        if (!data?.data) return { present: 0, late: 0, onTime: 0, percentage: 0 };

        const records = data.data.filter(r => r.signIn); // Only count actual attendance
        const late = records.filter(r => r.isLate).length;
        const onTime = records.length - late;

        // Calculate working days in month (rough estimate: total days - weekends)
        const totalDays = endOfMonth.getDate();
        const workingDays = Math.floor(totalDays * 5 / 7); // Approximate
        const percentage = workingDays > 0 ? Math.round((records.length / workingDays) * 100) : 0;

        return {
            present: records.length,
            late,
            onTime,
            percentage: Math.min(percentage, 100),
        };
    }, [data, endOfMonth]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Days Present</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.present}</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">On Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.onTime}</div>
                    <p className="text-xs text-muted-foreground">Days on time</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Late Days</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.late}</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.percentage}%</div>
                    <p className="text-xs text-muted-foreground">Monthly average</p>
                </CardContent>
            </Card>
        </div>
    );
}
