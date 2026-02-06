"use client";

import { useState, useEffect, useMemo } from "react";
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

/**
 * BreakTracker Component
 * 
 * Comprehensive break management interface for employees
 * - Start new breaks with type selection
 * - Real-time active break timer
 * - End active breaks
 * - Business rule validation (5-120 min, 180 min daily max)
 * 
 * Features:
 * - Auto-refresh every 30 seconds
 * - Optimistic UI updates
 * - Error handling with toast notifications
 * - Accessibility compliant
 * - Responsive design
 */
export function BreakTracker() {
    const { session } = useSession();
    const userId = session?.user.id;

    // State management
    const [selectedBreakType, setSelectedBreakType] = useState<BreakType>(BreakType.TEA);
    const [notes, setNotes] = useState("");
    const [elapsedMinutes, setElapsedMinutes] = useState(0);

    // API hooks
    const { data: activeBreakResponse, isLoading } = useActiveBreak();
    console.log({ activeBreakResponse, isLoading });
    const startBreakMutation = useStartBreak(userId);
    const endBreakMutation = useEndBreak(userId);

    const activeBreak = activeBreakResponse?.activeBreak;
    console.log({ activeBreak });

    // Calculate elapsed time for active break
    useEffect(() => {
        if (!activeBreak?.startTime) {
            setElapsedMinutes(0);
            return;
        }

        const calculateElapsed = () => {
            const start = new Date(activeBreak.startTime);
            const now = new Date();
            const diffMs = now.getTime() - start.getTime();
            const minutes = Math.floor(diffMs / 60000);
            setElapsedMinutes(minutes);
        };

        // Initial calculation
        calculateElapsed();

        // Update every second for real-time display
        const interval = setInterval(calculateElapsed, 1000);

        return () => clearInterval(interval);
    }, [activeBreak?.startTime]);

    // Break type options with icons and labels
    const breakTypeOptions = useMemo(() => {
        return Object.values(BreakType).map((type) => ({
            value: type,
            label: getBreakTypeLabel(type),
            icon: getBreakTypeIcon(type),
        }));
    }, []);

    // Handlers
    const handleStartBreak = () => {
        if (!selectedBreakType) return;

        startBreakMutation.mutate({
            breakType: selectedBreakType,
            notes: notes.trim() || undefined,
        });

        // Reset form
        setNotes("");
    };

    const handleEndBreak = () => {
        if (!activeBreak) return;
        endBreakMutation.mutate(activeBreak.id);
    };

    // Loading state
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

    // Active break UI
    if (activeBreak) {
        const isOverLimit = elapsedMinutes > 120; // 2 hours max per break
        const isWarning = elapsedMinutes > 60; // Warning after 1 hour

        return (
            <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Coffee className="h-5 w-5 text-orange-600" />
                            <CardTitle className="text-orange-900">Break Active</CardTitle>
                        </div>
                        <Badge variant={isOverLimit ? "destructive" : isWarning ? "default" : "secondary"}>
                            <Clock className="mr-1 h-3 w-3" />
                            {formatBreakDuration(elapsedMinutes)}
                        </Badge>
                    </div>
                    <CardDescription>
                        {getBreakTypeIcon(activeBreak.breakType)} {getBreakTypeLabel(activeBreak.breakType)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Real-time timer display */}
                    <div className="rounded-lg bg-white p-6 text-center">
                        <div className="text-sm text-muted-foreground mb-2">Elapsed Time</div>
                        <div className="text-4xl font-bold tabular-nums text-orange-600">
                            {Math.floor(elapsedMinutes / 60)
                                .toString()
                                .padStart(2, "0")}
                            :
                            {(elapsedMinutes % 60).toString().padStart(2, "0")}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                            Started at {new Date(activeBreak.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>

                    {/* Warning messages */}
                    {isOverLimit && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            ⚠️ Break exceeds maximum duration (120 minutes). Please end your break.
                        </div>
                    )}
                    {isWarning && !isOverLimit && (
                        <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                            ⏰ You've been on break for over an hour. Consider ending your break soon.
                        </div>
                    )}

                    {/* Notes display */}
                    {activeBreak.notes && (
                        <div className="rounded-md bg-muted p-3">
                            <div className="text-xs text-muted-foreground mb-1">Notes</div>
                            <div className="text-sm">{activeBreak.notes}</div>
                        </div>
                    )}

                    {/* End break button */}
                    <Button
                        onClick={handleEndBreak}
                        disabled={endBreakMutation.isPending}
                        size="lg"
                        variant="destructive"
                        className="w-full"
                    >
                        <Square className="mr-2 h-4 w-4" />
                        {endBreakMutation.isPending ? "Ending Break..." : "End Break"}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Start break UI
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Coffee className="h-5 w-5" />
                    Take a Break
                </CardTitle>
                <CardDescription>
                    Start tracking your break time. Remember: 5-120 minutes per break, 180 minutes daily maximum.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Break type selection */}
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
                            {breakTypeOptions.map((option) => (
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

                {/* Optional notes */}
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

                {/* Business rules reminder */}
                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                    <div className="font-medium">Break Guidelines:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                        <li>Minimum: 5 minutes per break</li>
                        <li>Maximum: 120 minutes per break</li>
                        <li>Daily limit: 180 minutes total</li>
                    </ul>
                </div>

                {/* Start break button */}
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
