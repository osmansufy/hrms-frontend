"use client";

import { useMemo } from "react";
import { Coffee, TrendingUp, Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyBreaks } from "@/lib/queries/attendance";
import { calculateBreakSummary, formatBreakDuration } from "@/lib/api/attendance";

/**
 * BreakStatsCard Component
 * 
 * Monthly break statistics overview for employee dashboard
 * - Total breaks taken this month
 * - Total time spent on breaks
 * - Average break duration
 * - Daily average breaks
 * - Policy compliance indicator
 * 
 * Features:
 * - Month-to-date aggregation
 * - Visual comparison metrics
 * - Performance indicators
 * - Responsive grid layout
 */
export function BreakStatsCard() {
    // Get current month date range
    const dateRange = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            currentMonth: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            workingDays: Math.floor((now.getDate() * 5) / 7), // Rough estimate
        };
    }, []);

    // Fetch month's breaks
    const { data: response, isLoading } = useMyBreaks({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
    });

    const breaks = response?.breaks || [];
    const summary = useMemo(() => calculateBreakSummary(breaks), [breaks]);

    // Calculate derived statistics
    const stats = useMemo(() => {
        const completedBreaks = breaks.filter((b) => b.endTime !== null);
        const avgDuration =
            completedBreaks.length > 0
                ? Math.round(summary.totalMinutes / completedBreaks.length)
                : 0;
        const avgPerDay =
            dateRange.workingDays > 0
                ? (completedBreaks.length / dateRange.workingDays).toFixed(1)
                : "0.0";

        return {
            totalBreaks: summary.totalBreaks,
            totalMinutes: summary.totalMinutes,
            avgDuration,
            avgPerDay,
        };
    }, [summary, breaks, dateRange.workingDays]);

    // Loading state
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Breaks */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Breaks</CardTitle>
                    <Coffee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalBreaks}</div>
                    <p className="text-xs text-muted-foreground">{dateRange.currentMonth}</p>
                </CardContent>
            </Card>

            {/* Total Break Time */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatBreakDuration(stats.totalMinutes)}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.totalMinutes > 0 ? `${Math.round(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m` : "No breaks yet"}
                    </p>
                </CardContent>
            </Card>

            {/* Average Break Duration */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatBreakDuration(stats.avgDuration)}</div>
                    <p className="text-xs text-muted-foreground">Per break</p>
                </CardContent>
            </Card>

            {/* Daily Average */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.avgPerDay}</div>
                    <p className="text-xs text-muted-foreground">Breaks per day</p>
                </CardContent>
            </Card>
        </div>
    );
}
