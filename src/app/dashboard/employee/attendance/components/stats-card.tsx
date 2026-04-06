"use client";

import { useMemo } from "react";
import { Calendar, Clock, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyMonthlyAttendanceSummary } from "@/lib/queries/attendance";

export function AttendanceStatsCard() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const { data: summary } = useMyMonthlyAttendanceSummary({ year, month });

    const stats = useMemo(() => {
        if (!summary) return { present: 0, late: 0, onTime: 0, percentage: 0 };

        const present = summary.totalPresentDays ?? 0;
        const late = summary.totalLateDays ?? 0;
        const onTime = present - late;
        const workingDays = summary.totalWorkingDays ?? 0;
        const percentage = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0;

        return {
            present,
            late,
            onTime,
            percentage: Math.min(percentage, 100),
        };
    }, [summary]);

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
