"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2 } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { useMyAttendanceRecords } from "@/lib/queries/attendance";
import { toStartOfDayISO, toEndOfDayISO, formatInDhakaTimezone } from "@/lib/utils";

const COLORS = {
    onTime: "#22c55e", // green-500
    late: "#f59e0b", // amber-500
    absent: "#ef4444", // red-500
    weekend: "#94a3b8", // slate-400
};

export function AttendancePieChart() {
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

    const { data, isLoading } = useMyAttendanceRecords(userId, queryParams);

    const chartData = useMemo(() => {
        if (!data?.data) {
            return [];
        }

        const records = data.data;
        const lateCount = records.filter(r => r.signIn && r.isLate).length;
        const onTimeCount = records.filter(r => r.signIn && !r.isLate).length;

        // Calculate ACTUAL working days up to today (not entire month)
        const today = new Date();
        let workingDaysCount = 0;

        // Count working days from start of month to today
        const tempDate = new Date(startOfMonth);
        while (tempDate <= today) {
            const dayOfWeek = tempDate.getDay();
            // Count if it's a weekday (Monday = 1 to Friday = 5)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                workingDaysCount++;
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }

        const presentDays = onTimeCount + lateCount;
        const absentDays = Math.max(0, workingDaysCount - presentDays);

        const dataPoints = [];

        if (onTimeCount > 0) {
            dataPoints.push({
                name: "On Time",
                value: onTimeCount,
                color: COLORS.onTime,
            });
        }

        if (lateCount > 0) {
            dataPoints.push({
                name: "Late",
                value: lateCount,
                color: COLORS.late,
            });
        }

        if (absentDays > 0) {
            dataPoints.push({
                name: "Absent",
                value: absentDays,
                color: COLORS.absent,
            });
        }

        return dataPoints;
    }, [data, startOfMonth]);

    const monthName = useMemo(() => {
        return formatInDhakaTimezone(new Date(), { month: "long", year: "numeric" });
    }, []);

    const totalPresent = useMemo(() => {
        return chartData.reduce((sum, item) => {
            if (item.name !== "Absent") {
                return sum + item.value;
            }
            return sum;
        }, 0);
    }, [chartData]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Monthly Attendance
                    </CardTitle>
                    <CardDescription>{monthName}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Monthly Attendance
                    </CardTitle>
                    <CardDescription>{monthName}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <p className="text-sm text-muted-foreground">No attendance data for this month</p>
                </CardContent>
            </Card>
        );
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border rounded-lg shadow-lg p-3">
                    <p className="font-semibold">{payload[0].name}</p>
                    <p className="text-sm text-muted-foreground">
                        {payload[0].value} {payload[0].value === 1 ? "day" : "days"}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Monthly Attendance
                </CardTitle>
                <CardDescription>{monthName} • {totalPresent} days present</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            label={({ name, value }) => `${name}: ${value}`}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value, entry: any) => (
                                <span className="text-sm">
                                    {value} ({entry.payload.value})
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    {chartData.map((item) => (
                        <div key={item.name} className="text-center">
                            <div
                                className="w-3 h-3 rounded-full mx-auto mb-1"
                                style={{ backgroundColor: item.color }}
                            />
                            <p className="text-sm font-medium">{item.value}</p>
                            <p className="text-xs text-muted-foreground">{item.name}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
