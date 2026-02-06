"use client";

import { useMemo } from "react";
import { History, Clock, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyBreaks } from "@/lib/queries/attendance";
import {
    getBreakTypeLabel,
    getBreakTypeIcon,
    formatBreakDuration,
    calculateBreakSummary,
    type AttendanceBreak,
} from "@/lib/api/attendance";

/**
 * BreakHistoryCard Component
 * 
 * Displays today's break history with comprehensive statistics
 * - List of all breaks taken today
 * - Duration and status for each break
 * - Total break time and count
 * - Visual indicators for policy compliance
 * 
 * Features:
 * - Real-time updates
 * - Active break highlighting
 * - Daily limit warnings (180 min)
 * - Empty state handling
 * - Responsive layout
 */
export function BreakHistoryCard() {
    // Get today's date range for filtering
    const today = useMemo(() => {
        const date = new Date();
        return date.toISOString().split('T')[0];
    }, []);

    // Fetch today's breaks
    const { data: response, isLoading } = useMyBreaks({
        startDate: today,
        endDate: today,
    });

    const breaks = response?.breaks || [];
    const summary = useMemo(() => calculateBreakSummary(breaks), [breaks]);

    // Check if approaching or exceeding daily limit (180 minutes)
    const dailyLimit = 180;
    const isApproachingLimit = summary.totalMinutes >= dailyLimit * 0.8; // 80% of limit
    const isOverLimit = summary.totalMinutes > dailyLimit;

    // Loading state
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    // Empty state
    if (breaks.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Today's Breaks
                    </CardTitle>
                    <CardDescription>No breaks recorded today</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            You haven't taken any breaks today. Remember to take regular breaks for better productivity!
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Today's Breaks
                        </CardTitle>
                        <CardDescription>
                            {summary.totalBreaks} break{summary.totalBreaks !== 1 ? "s" : ""} • {formatBreakDuration(summary.totalMinutes)} total
                        </CardDescription>
                    </div>
                    <Badge
                        variant={isOverLimit ? "destructive" : isApproachingLimit ? "default" : "secondary"}
                    >
                        <TrendingDown className="mr-1 h-3 w-3" />
                        {summary.totalMinutes}/{dailyLimit}m
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Daily limit warning */}
                {isOverLimit && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        ⚠️ You've exceeded the daily break limit of 180 minutes. Please minimize further breaks.
                    </div>
                )}
                {isApproachingLimit && !isOverLimit && (
                    <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                        ⏰ You're approaching the daily break limit. You have {dailyLimit - summary.totalMinutes} minutes remaining.
                    </div>
                )}

                {/* Break list */}
                <div className="space-y-2">
                    {breaks.map((breakRecord) => (
                        <BreakListItem key={breakRecord.id} breakRecord={breakRecord} />
                    ))}
                </div>

                {/* Summary statistics */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs text-muted-foreground mb-1">Total Breaks</div>
                        <div className="text-2xl font-bold">{summary.totalBreaks}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs text-muted-foreground mb-1">Total Time</div>
                        <div className="text-2xl font-bold">{formatBreakDuration(summary.totalMinutes)}</div>
                    </div>
                </div>

                {/* Break type breakdown */}
                {summary.totalBreaks > 0 && (
                    <div className="rounded-lg bg-muted p-3 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Breakdown by Type</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(summary.byType)
                                .filter(([_, data]) => data.count > 0)
                                .map(([type, data]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            {getBreakTypeIcon(type as any)} {getBreakTypeLabel(type as any)}:
                                        </span>
                                        <span className="font-medium">{data.count}×</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Individual break list item component
 */
function BreakListItem({ breakRecord }: { breakRecord: AttendanceBreak }) {
    const isActive = breakRecord.endTime === null;

    // Calculate duration
    const duration = useMemo(() => {
        if (breakRecord.durationMinutes) {
            return breakRecord.durationMinutes;
        }
        if (isActive) {
            const start = new Date(breakRecord.startTime);
            const now = new Date();
            return Math.floor((now.getTime() - start.getTime()) / 60000);
        }
        return 0;
    }, [breakRecord.durationMinutes, breakRecord.startTime, isActive]);

    const startTime = new Date(breakRecord.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const endTime = breakRecord.endTime ? new Date(breakRecord.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "In Progress";

    return (
        <div
            className={`rounded-lg border p-3 transition-colors ${isActive ? "border-orange-300 bg-orange-50/50" : "border-border bg-card"
                }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getBreakTypeIcon(breakRecord.breakType)}</span>
                        <span className="font-medium text-sm">{getBreakTypeLabel(breakRecord.breakType)}</span>
                        {isActive && (
                            <Badge variant="default" className="text-xs">
                                Active
                            </Badge>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                                {startTime} → {endTime}
                            </span>
                        </div>
                        {breakRecord.notes && (
                            <div className="mt-1 text-foreground/70 italic truncate">
                                &quot;{breakRecord.notes}&quot;
                            </div>
                        )}
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className="font-bold text-sm">{formatBreakDuration(duration)}</div>
                    {duration > 120 && (
                        <div className="text-xs text-destructive">Over limit</div>
                    )}
                </div>
            </div>
        </div>
    );
}
