"use client";

import { useMemo } from "react";
import { Coffee, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAttendanceBreaks } from "@/lib/queries/attendance";
import {
    calculateBreakSummary,
    formatBreakDuration,
    getBreakTypeLabel,
    getBreakTypeIcon,
    type AttendanceBreak,
} from "@/lib/api/attendance";

interface BreakMonitorCardProps {
    attendanceId: string;
    employeeName?: string;
    signInTime?: string | null;
    signOutTime?: string | null;
}

/**
 * BreakMonitorCard Component
 * 
 * Admin view for monitoring employee breaks on attendance records
 * - View all breaks for a specific attendance record
 * - See break compliance status
 * - Monitor active breaks
 * - View break statistics and totals
 * 
 * Features:
 * - Real-time break status
 * - Policy compliance indicators
 * - Detailed break timeline
 * - Summary statistics
 * - Empty state handling
 * 
 * Usage:
 * <BreakMonitorCard 
 *   attendanceId="123"
 *   employeeName="John Doe"
 *   signInTime="2024-01-01T09:00:00Z"
 *   signOutTime="2024-01-01T17:00:00Z"
 * />
 */
export function BreakMonitorCard({
    attendanceId,
    employeeName,
    signInTime,
    signOutTime,
}: BreakMonitorCardProps) {
    // Fetch breaks for this attendance record
    const { data: response, isLoading } = useAttendanceBreaks(attendanceId);
    console.log({ response });
    const breaks = response?.breaks || [];
    const summary = useMemo(() => calculateBreakSummary(breaks), [breaks]);

    // Check policy compliance
    const dailyLimit = 180; // 180 minutes
    const isCompliant = summary.totalMinutes <= dailyLimit;
    const hasActiveBreak = summary.activeBreak !== null;

    // Loading state
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        );
    }

    // Empty state
    if (breaks.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Coffee className="h-4 w-4" />
                        Break Activity
                    </CardTitle>
                    <CardDescription>No breaks recorded</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground text-center py-4">
                        No breaks were taken during this shift.
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
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Coffee className="h-4 w-4" />
                            Break Activity
                            {hasActiveBreak && (
                                <Badge variant="default" className="text-xs">
                                    Active Break
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {summary.totalBreaks} break{summary.totalBreaks !== 1 ? "s" : ""} • {formatBreakDuration(summary.totalMinutes)} total
                        </CardDescription>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                {isCompliant ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-destructive" />
                                )}
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">
                                    {isCompliant
                                        ? "Within daily limit (180 min)"
                                        : `Exceeded daily limit by ${summary.totalMinutes - dailyLimit} minutes`}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-muted p-2">
                        <div className="text-xs text-muted-foreground">Breaks</div>
                        <div className="text-lg font-bold">{summary.totalBreaks}</div>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="text-lg font-bold">{formatBreakDuration(summary.totalMinutes)}</div>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                        <div className="text-xs text-muted-foreground">Avg</div>
                        <div className="text-lg font-bold">
                            {formatBreakDuration(Math.round(summary.totalMinutes / summary.totalBreaks))}
                        </div>
                    </div>
                </div>

                {/* Policy compliance indicator */}
                {!isCompliant && (
                    <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Exceeded daily limit by {summary.totalMinutes - dailyLimit} minutes</span>
                    </div>
                )}

                {/* Break timeline */}
                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Timeline</div>
                    <div className="space-y-1.5">
                        {breaks.map((breakRecord) => (
                            <AdminBreakItem key={breakRecord.id} breakRecord={breakRecord} />
                        ))}
                    </div>
                </div>

                {/* Break type distribution */}
                <div className="rounded-md bg-muted p-2 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Distribution</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                        {Object.entries(summary.byType)
                            .filter(([_, data]) => data.count > 0)
                            .map(([type, data]) => (
                                <div key={type} className="flex items-center justify-between">
                                    <span>
                                        {getBreakTypeIcon(type as any)} {getBreakTypeLabel(type as any)}
                                    </span>
                                    <span className="font-medium">
                                        {data.count}× ({formatBreakDuration(data.minutes)})
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Individual break item for admin timeline
 */
function AdminBreakItem({ breakRecord }: { breakRecord: AttendanceBreak }) {
    const isActive = breakRecord.endTime === null;

    const startTime = new Date(breakRecord.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const endTime = breakRecord.endTime
        ? new Date(breakRecord.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : "Ongoing";

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

    const isOverLimit = duration > 120; // 2 hour max per break

    return (
        <div
            className={`flex items-center justify-between p-2 rounded-md text-xs ${isActive
                ? "bg-orange-50 border border-orange-200"
                : "bg-card border border-border"
                }`}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <span>{getBreakTypeIcon(breakRecord.breakType)}</span>
                <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{getBreakTypeLabel(breakRecord.breakType)}</div>
                    <div className="text-muted-foreground">
                        {startTime} → {endTime}
                    </div>
                </div>
            </div>
            <div className="text-right shrink-0 ml-2">
                <div className={`font-medium ${isOverLimit ? "text-destructive" : ""}`}>
                    {formatBreakDuration(duration)}
                </div>
                {isActive && (
                    <Badge variant="default" className="text-[10px] h-4 px-1">
                        Active
                    </Badge>
                )}
            </div>
        </div>
    );
}
