"use client";

import { useState, useCallback, memo } from "react";
import { Play, Square, Coffee, Clock } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useEffect } from "react";
import { useState as useTimerState } from "react";

// Static — computed once at module load, no useMemo overhead
const BREAK_TYPE_OPTIONS = Object.values(BreakType).map((type) => ({
    value: type,
    label: getBreakTypeLabel(type),
    icon: getBreakTypeIcon(type),
}));

// ---------------------------------------------------------------------------
// ActiveBreakDisplay — memoised so timer ticks never re-render the parent
// ---------------------------------------------------------------------------

interface ActiveBreak {
    id: string;
    startTime: string;
    breakType: BreakType;
    notes?: string | null;
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
    const [elapsedSeconds, setElapsedSeconds] = useTimerState(0);

    useEffect(() => {
        const start = new Date(activeBreak.startTime).getTime();

        const tick = () => setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
        tick(); // immediate first paint

        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [activeBreak.startTime]);

    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    const isWarning = elapsedSeconds > 3600; // > 1 hour

    return (
        <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Coffee className="h-5 w-5 text-orange-600" />
                        <CardTitle className="text-orange-900">Break Active</CardTitle>
                    </div>
                    <Badge variant={isWarning ? "default" : "secondary"}>
                        <Clock className="mr-1 h-3 w-3" />
                        {formatBreakDuration(Math.floor(elapsedSeconds / 60))}
                    </Badge>
                </div>
                <CardDescription>
                    {getBreakTypeIcon(activeBreak.breakType)} {getBreakTypeLabel(activeBreak.breakType)}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Real-time timer — HH:MM:SS */}
                <div className="rounded-lg bg-white p-6 text-center">
                    <div className="text-sm text-muted-foreground mb-2">Elapsed Time</div>
                    <div className="text-4xl font-bold tabular-nums text-orange-600">
                        {hours.toString().padStart(2, "0")}:
                        {minutes.toString().padStart(2, "0")}:
                        {seconds.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        Started at{" "}
                        {new Date(activeBreak.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                </div>

                {isWarning && (
                    <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                        ⏰ You&apos;ve been on break for over an hour. Consider ending your break soon.
                    </div>
                )}

                {activeBreak.notes && (
                    <div className="rounded-md bg-muted p-3">
                        <div className="text-xs text-muted-foreground mb-1">Notes</div>
                        <div className="text-sm">{activeBreak.notes}</div>
                    </div>
                )}

                <Button
                    onClick={onEndBreak}
                    disabled={isEnding}
                    size="lg"
                    variant="destructive"
                    className="w-full"
                >
                    <Square className="mr-2 h-4 w-4" />
                    {isEnding ? "Ending Break..." : "End Break"}
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

    const { data: activeBreakResponse, isLoading } = useActiveBreak();
    const startBreakMutation = useStartBreak(userId);
    const endBreakMutation = useEndBreak(userId);

    const activeBreak = activeBreakResponse?.activeBreak;

    const handleStartBreak = useCallback(() => {
        if (!selectedBreakType) return;
        startBreakMutation.mutate({
            breakType: selectedBreakType,
            notes: notes.trim() || undefined,
        });
        setNotes("");
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
                    <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
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
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Coffee className="h-5 w-5" />
                    Take a Break
                </CardTitle>
                <CardDescription>Start tracking your break time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="break-type">Break Type</Label>
                    <Select
                        value={selectedBreakType}
                        onValueChange={(value) => setSelectedBreakType(value as BreakType)}
                    >
                        <SelectTrigger id="break-type">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {BREAK_TYPE_OPTIONS.filter(option => option.value !== BreakType.PRAYER && option.value !== BreakType.MEDICAL && option.value !== BreakType.PERSONAL).map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    <span className="flex items-center gap-2">
                                        <span>{option.icon}</span>
                                        <span>{option.label}</span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="break-notes">Notes (Optional)</Label>
                    <Textarea
                        id="break-notes"
                        placeholder="Add any notes about your break..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        maxLength={500}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                        {notes.length}/500 characters
                    </div>
                </div>

                <Button
                    onClick={handleStartBreak}
                    disabled={startBreakMutation.isPending || !selectedBreakType}
                    size="lg"
                    className="w-full"
                >
                    <Play className="mr-2 h-4 w-4" />
                    {startBreakMutation.isPending ? "Starting Break..." : "Start Break"}
                </Button>
            </CardContent>
        </Card>
    );
}
