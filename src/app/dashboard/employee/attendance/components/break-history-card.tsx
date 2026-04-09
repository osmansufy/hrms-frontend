"use client";

import { useMemo } from "react";
import { Coffee, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

export function BreakHistoryCard() {
    const today = useMemo(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }, []);

    const { data: response, isLoading } = useMyBreaks({ startDate: today, endDate: today });

    const breaks  = response?.data || [];
    const summary = useMemo(() => calculateBreakSummary(breaks), [breaks]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex items-start gap-3">
                            <Skeleton className="mt-1 size-3 shrink-0 rounded-full" />
                            <Skeleton className="h-14 flex-1 rounded-lg" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                            <Coffee className="size-4 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-base font-semibold">Today&apos;s Breaks</CardTitle>
                    </div>

                    {breaks.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="gap-1 font-medium">
                                <Clock className="size-3" />
                                {formatBreakDuration(summary.totalMinutes)}
                            </Badge>
                            <Badge variant="outline" className="font-medium">
                                {summary.totalBreaks}×
                            </Badge>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {breaks.length === 0 ? (
                    /* ── Empty state ── */
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
                            <Coffee className="size-6 text-muted-foreground/60" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No breaks yet today</p>
                        <p className="mt-1 text-xs text-muted-foreground/70">
                            Regular breaks improve focus and well-being.
                        </p>
                    </div>
                ) : (
                    /* ── Timeline list ── */
                    <div className="relative pl-5">
                        {/* Vertical timeline rail */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                        <div className="space-y-3">
                            {breaks.map((breakRecord) => (
                                <div key={breakRecord.id} className="relative flex items-start gap-3">
                                    {/* Timeline dot */}
                                    {breakRecord.endTime === null ? (
                                        <span className="relative mt-3.5 flex size-3 shrink-0">
                                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-400 opacity-60" />
                                            <span className="relative inline-flex size-3 rounded-full border-2 border-background bg-orange-500 ring-2 ring-orange-300 dark:ring-orange-700" />
                                        </span>
                                    ) : (
                                        <span className="mt-3.5 size-3 shrink-0 rounded-full border-2 border-background bg-muted-foreground/40 ring-1 ring-border" />
                                    )}

                                    <BreakListItem breakRecord={breakRecord} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function BreakListItem({ breakRecord }: { breakRecord: AttendanceBreak }) {
    const isActive = breakRecord.endTime === null;

    const duration = useMemo(() => {
        if (breakRecord.durationMinutes) return breakRecord.durationMinutes;
        if (isActive) {
            return Math.floor((Date.now() - new Date(breakRecord.startTime).getTime()) / 60000);
        }
        return 0;
    }, [breakRecord.durationMinutes, breakRecord.startTime, isActive]);

    const startTime = new Date(breakRecord.startTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
    const endTime = breakRecord.endTime
        ? new Date(breakRecord.endTime).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })
        : null;

    return (
        <div className={cn(
            "flex-1 rounded-lg border px-3 py-2.5 transition-colors",
            isActive
                ? "border-orange-200 bg-orange-50/60 dark:border-orange-900 dark:bg-orange-950/20"
                : "border-border bg-card",
        )}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-base leading-none">{getBreakTypeIcon(breakRecord.breakType)}</span>
                        <span className="text-sm font-medium">{getBreakTypeLabel(breakRecord.breakType)}</span>
                        {isActive && (
                            <Badge className="h-4 bg-orange-500 px-1.5 text-[10px] text-white hover:bg-orange-600">
                                Live
                            </Badge>
                        )}
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3 shrink-0" />
                        <span>
                            {startTime}
                            {endTime ? <> → {endTime}</> : " → now"}
                        </span>
                    </div>

                    {breakRecord.reason && (
                        <div className="mt-1.5 truncate text-xs italic text-foreground/60">
                            &ldquo;{breakRecord.reason}&rdquo;
                        </div>
                    )}
                </div>

                <div className="shrink-0 text-right">
                    <span className={cn(
                        "text-sm font-semibold tabular-nums",
                        isActive ? "text-orange-600" : "",
                    )}>
                        {formatBreakDuration(duration)}
                    </span>
                </div>
            </div>
        </div>
    );
}
