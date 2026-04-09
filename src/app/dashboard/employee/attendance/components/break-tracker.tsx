"use client";

import { useState, useCallback, memo, useEffect } from "react";
import { Square, Coffee, Clock, ChevronDown, ChevronUp, TriangleAlert } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    useActiveBreak,
    useStartBreak,
    useEndBreak,
} from "@/lib/queries/attendance";
import {
    BreakType,
    getBreakTypeLabel,
    getBreakTypeIcon,
    formatBreakDuration,
} from "@/lib/api/attendance";
import { cn } from "@/lib/utils";

// Break types visible in the quick-select UI
const QUICK_BREAK_TYPES = Object.values(BreakType).filter(
    (t) => t !== BreakType.PRAYER && t !== BreakType.MEDICAL && t !== BreakType.PERSONAL,
);

// ---------------------------------------------------------------------------
// ActiveBreakDisplay — memoised so timer ticks never re-render the parent
// ---------------------------------------------------------------------------

interface ActiveBreak {
    id: string;
    startTime: string;
    breakType: BreakType;
    reason?: string | null;
}

interface ActiveBreakDisplayProps {
    activeBreak: ActiveBreak;
    onEndBreak: () => void;
    isEnding: boolean;
}

const ActiveBreakDisplay = memo(function ActiveBreakDisplay({
    activeBreak,
    onEndBreak,
    isEnding,
}: ActiveBreakDisplayProps) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        const start = new Date(activeBreak.startTime).getTime();
        const tick = () => setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [activeBreak.startTime]);

    const hours   = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    const isWarning = elapsedSeconds > 3600; // > 1 hour

    const startedAt = new Date(activeBreak.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <Card className={cn(
            "border-2 transition-colors",
            isWarning
                ? "border-yellow-300 dark:border-yellow-800"
                : "border-orange-200 dark:border-orange-900",
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        {/* Pulsing live indicator */}
                        <span className="relative flex size-3">
                            <span className={cn(
                                "absolute inline-flex size-full animate-ping rounded-full opacity-60",
                                isWarning ? "bg-yellow-400" : "bg-orange-400",
                            )} />
                            <span className={cn(
                                "relative inline-flex size-3 rounded-full",
                                isWarning ? "bg-yellow-500" : "bg-orange-500",
                            )} />
                        </span>
                        <CardTitle className="text-base font-semibold">Break Active</CardTitle>
                    </div>
                    <Badge className={cn(
                        "gap-1.5 text-white",
                        isWarning ? "bg-yellow-500 hover:bg-yellow-600" : "bg-orange-500 hover:bg-orange-600",
                    )}>
                        <Clock className="size-3" />
                        {formatBreakDuration(Math.floor(elapsedSeconds / 60))}
                    </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span className="text-base leading-none">{getBreakTypeIcon(activeBreak.breakType)}</span>
                    <span>{getBreakTypeLabel(activeBreak.breakType)}</span>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Timer display */}
                <div className={cn(
                    "relative overflow-hidden rounded-2xl p-6 text-center ring-1",
                    isWarning
                        ? "bg-gradient-to-br from-yellow-50 to-amber-50 ring-yellow-100 dark:from-yellow-950/30 dark:to-amber-950/20 dark:ring-yellow-900/50"
                        : "bg-gradient-to-br from-orange-50 to-amber-50 ring-orange-100 dark:from-orange-950/30 dark:to-amber-950/20 dark:ring-orange-900/50",
                )}>
                    <div className={cn(
                        "mb-1.5 text-xs font-semibold uppercase tracking-widest",
                        isWarning ? "text-yellow-500/80" : "text-orange-500/80",
                    )}>
                        Elapsed Time
                    </div>
                    <div className={cn(
                        "text-5xl font-bold tabular-nums tracking-tight",
                        isWarning ? "text-yellow-600 dark:text-yellow-400" : "text-orange-600 dark:text-orange-400",
                    )}>
                        {hours.toString().padStart(2, "0")}
                        <span className="mx-0.5 opacity-60">:</span>
                        {minutes.toString().padStart(2, "0")}
                        <span className="mx-0.5 opacity-60">:</span>
                        {seconds.toString().padStart(2, "0")}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                        Started at {startedAt}
                    </div>
                </div>

                {/* Warning banner */}
                {isWarning && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-300">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                        <span>You&apos;ve been on break for over an hour. Consider returning soon.</span>
                    </div>
                )}

                {/* Notes */}
                {activeBreak.reason && (
                    <div className="rounded-lg bg-muted/60 px-3 py-2.5">
                        <div className="mb-1 text-xs font-medium text-muted-foreground">Notes</div>
                        <div className="text-sm italic text-foreground/80">&ldquo;{activeBreak.reason}&rdquo;</div>
                    </div>
                )}

                <Button
                    onClick={onEndBreak}
                    disabled={isEnding}
                    size="lg"
                    variant="destructive"
                    className="w-full gap-2"
                >
                    <Square className="size-4" fill="currentColor" />
                    {isEnding ? "Ending Break…" : "End Break"}
                </Button>
            </CardContent>
        </Card>
    );
});

// ---------------------------------------------------------------------------
// BreakTracker — parent; only re-renders on query/mutation state changes
// ---------------------------------------------------------------------------

export function BreakTracker() {
    const { session } = useSession();
    const userId = session?.user.id;

    const [selectedBreakType, setSelectedBreakType] = useState<BreakType>(BreakType.TEA);
    const [notes, setNotes] = useState("");
    const [showNotes, setShowNotes] = useState(false);

    const { data: activeBreakResponse, isLoading } = useActiveBreak();
    const startBreakMutation = useStartBreak(userId);
    const endBreakMutation   = useEndBreak(userId);

    const activeBreak = activeBreakResponse?.activeBreak;

    const handleStartBreak = useCallback(() => {
        if (!selectedBreakType) return;
        startBreakMutation.mutate({
            breakType: selectedBreakType,
            reason: notes.trim() || undefined,
        });
        setNotes("");
        setShowNotes(false);
    }, [selectedBreakType, notes, startBreakMutation]);

    const handleEndBreak = useCallback(() => {
        if (!activeBreak) return;
        endBreakMutation.mutate(activeBreak.id);
    }, [activeBreak, endBreakMutation]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                    </div>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (activeBreak) {
        return (
            <ActiveBreakDisplay
                activeBreak={activeBreak}
                onEndBreak={handleEndBreak}
                isEnding={endBreakMutation.isPending}
            />
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/40">
                        <Coffee className="size-4 text-orange-600" />
                    </div>
                    <CardTitle className="text-base font-semibold">Take a Break</CardTitle>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Quick-select break type */}
                <div>
                    <p className="mb-2.5 text-xs font-medium text-muted-foreground">Select break type</p>
                    <div className="grid grid-cols-3 gap-2">
                        {QUICK_BREAK_TYPES.map((type) => {
                            const isSelected = selectedBreakType === type;
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setSelectedBreakType(type)}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        isSelected
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-border hover:border-muted-foreground/40 hover:bg-muted/50",
                                    )}
                                >
                                    <span className="text-2xl leading-none">
                                        {getBreakTypeIcon(type)}
                                    </span>
                                    <span className={cn(
                                        "text-xs font-medium leading-tight",
                                        isSelected ? "text-primary" : "text-muted-foreground",
                                    )}>
                                        {getBreakTypeLabel(type).replace(" Break", "")}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Collapsible notes */}
                <div>
                    <button
                        type="button"
                        onClick={() => setShowNotes((v) => !v)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        {showNotes ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                        {showNotes ? "Hide notes" : "Add a note (optional)"}
                    </button>

                    {showNotes && (
                        <div className="mt-2 space-y-1">
                            <Textarea
                                placeholder="Anything to note about this break…"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                maxLength={500}
                                className="resize-none text-sm"
                            />
                            <div className="text-right text-xs text-muted-foreground">
                                {notes.length}/500
                            </div>
                        </div>
                    )}
                </div>

                <Button
                    onClick={handleStartBreak}
                    disabled={startBreakMutation.isPending || !selectedBreakType}
                    size="lg"
                    className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                >
                    <span className="text-base leading-none">{getBreakTypeIcon(selectedBreakType)}</span>
                    {startBreakMutation.isPending ? "Starting…" : `Start ${getBreakTypeLabel(selectedBreakType).replace(" Break", "")} Break`}
                </Button>
            </CardContent>
        </Card>
    );
}
