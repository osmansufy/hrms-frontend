"use client";

import { useMemo, useState } from "react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import {
    Coffee,
    TrendingUp,
    Clock,
    BarChart2,
    CalendarRange,
    CalendarDays,
    LayoutGrid,
    Loader2,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyBreaks } from "@/lib/queries/attendance";
import {
    calculateBreakSummary,
    formatBreakDuration,
    getBreakTypeLabel,
    getBreakTypeIcon,
    type AttendanceBreak,
} from "@/lib/api/attendance";
import {
    useDateRangePresets,
    DATE_RANGE_PRESETS,
    type DateRangePreset,
} from "@/hooks/useDateRangePresets";
import { useTimezoneFormatters } from "@/lib/hooks/use-timezone-formatters";

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterMode = "preset" | "monthly";

function currentMonthValue() {
    return format(new Date(), "yyyy-MM");
}

function monthToRange(ym: string): { startDate: string; endDate: string } {
    const [y, m] = ym.split("-").map(Number) as [number, number];
    const ref = new Date(y, m - 1, 1);
    return {
        startDate: format(startOfMonth(ref), "yyyy-MM-dd"),
        endDate:   format(endOfMonth(ref), "yyyy-MM-dd"),
    };
}

function daysBetween(a: string, b: string) {
    const ms = new Date(b).getTime() - new Date(a).getTime();
    return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

// ─── Metric card (mirrors stats-card.tsx style) ──────────────────────────────

function MetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor,
    bgColor,
    loading,
}: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    loading?: boolean;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`rounded-md p-1.5 ${bgColor}`}>
                    <Icon className={`size-4 ${iconColor}`} />
                </div>
            </CardHeader>
            <CardContent className="space-y-1">
                {loading ? (
                    <>
                        <Skeleton className="h-7 w-16" />
                        <Skeleton className="h-3 w-28 mt-1" />
                    </>
                ) : (
                    <>
                        <div className="text-2xl font-bold tracking-tight">{value}</div>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Date-range filter strip ──────────────────────────────────────────────────

function BreakDateRangeFilter({
    filterMode,
    setFilterMode,
    preset,
    dateRange,
    setPreset,
    setCustomRange,
    selectedMonth,
    setSelectedMonth,
}: {
    filterMode: FilterMode;
    setFilterMode: (m: FilterMode) => void;
    preset: DateRangePreset;
    dateRange: { startDate: string; endDate: string };
    setPreset: (p: DateRangePreset) => void;
    setCustomRange: (r: { startDate?: string; endDate?: string }) => void;
    selectedMonth: string;
    setSelectedMonth: (m: string) => void;
}) {
    const today    = format(new Date(), "yyyy-MM-dd");
    const maxMonth = currentMonthValue();

    const effectiveRange = filterMode === "monthly" ? monthToRange(selectedMonth) : dateRange;

    const rangeLabel = useMemo(() => {
        const { startDate, endDate } = effectiveRange;
        const fmt = (d: string) => format(parseISO(d), "MMM d, yyyy");
        return startDate === endDate ? fmt(startDate) : `${fmt(startDate)} – ${fmt(endDate)}`;
    }, [effectiveRange]);

    const days = useMemo(
        () => daysBetween(effectiveRange.startDate, effectiveRange.endDate),
        [effectiveRange],
    );

    const monthLabel = useMemo(() => {
        const [y, m] = selectedMonth.split("-").map(Number) as [number, number];
        return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }, [selectedMonth]);

    return (
        <div className="space-y-3">
            {/* Pill strip */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {DATE_RANGE_PRESETS.map((option) => {
                    const active = filterMode === "preset" && preset === option.value;
                    return (
                        <button
                            key={option.value}
                            onClick={() => { setFilterMode("preset"); setPreset(option.value as DateRangePreset); }}
                            className={[
                                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                active
                                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                            ].join(" ")}
                        >
                            {option.label}
                        </button>
                    );
                })}

                <div className="mx-1 w-px self-stretch shrink-0 bg-border" />

                <button
                    onClick={() => setFilterMode("monthly")}
                    className={[
                        "shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        filterMode === "monthly"
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    ].join(" ")}
                >
                    <LayoutGrid className="size-3 shrink-0" />
                    {filterMode === "monthly" ? monthLabel : "Monthly"}
                </button>
            </div>

            {/* Monthly picker panel */}
            {filterMode === "monthly" && (
                <div className="flex items-end gap-3 rounded-lg border bg-muted/30 p-3">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Select month</label>
                        <Input
                            type="month"
                            value={selectedMonth}
                            max={maxMonth}
                            className="h-8 w-44 text-sm"
                            onChange={(e) => { if (e.target.value) setSelectedMonth(e.target.value); }}
                        />
                    </div>
                    <p className="pb-1 text-xs text-muted-foreground">Showing full month · {days} days</p>
                </div>
            )}

            {/* Custom date range picker */}
            {filterMode === "preset" && preset === "custom" && (
                <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 sm:max-w-sm">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">From</label>
                        <Input
                            type="date"
                            value={dateRange.startDate}
                            max={today}
                            className="h-8 text-sm"
                            onChange={(e) => setCustomRange({ startDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">To</label>
                        <Input
                            type="date"
                            value={dateRange.endDate}
                            max={today}
                            className="h-8 text-sm"
                            onChange={(e) => setCustomRange({ endDate: e.target.value })}
                        />
                    </div>
                </div>
            )}

            {/* Active range label */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarRange className="size-3.5 shrink-0" />
                <span>
                    <span className="font-medium text-foreground">{rangeLabel}</span>
                    <span className="ml-1.5">({days} {days === 1 ? "day" : "days"})</span>
                </span>
            </div>
        </div>
    );
}

// ─── Break record table row ───────────────────────────────────────────────────

function BreakTableRow({ record, index }: { record: AttendanceBreak; index: number }) {
    const isActive = record.endTime === null;
    const { formatTime, formatDate } = useTimezoneFormatters();

    const startTime  = formatTime(record.startTime);
    const endTime    = record.endTime ? formatTime(record.endTime) : null;
    const dateLabel  = formatDate(record.startTime, "short");
    const duration   = record.durationMinutes ?? (
        isActive
            ? Math.floor((Date.now() - new Date(record.startTime).getTime()) / 60000)
            : 0
    );

    return (
        <TableRow className={[
            index % 2 !== 0 ? "bg-muted/20" : "",
            isActive ? "bg-orange-50/60 dark:bg-orange-950/20" : "",
            "hover:bg-muted/40 transition-colors",
        ].join(" ")}>
            <TableCell className="font-medium text-sm">{dateLabel}</TableCell>

            <TableCell>
                <span className="flex items-center gap-1.5 text-sm">
                    <span className="text-base leading-none">{getBreakTypeIcon(record.breakType)}</span>
                    <span className="hidden sm:inline">{getBreakTypeLabel(record.breakType)}</span>
                </span>
            </TableCell>

            <TableCell className="tabular-nums text-sm">{startTime}</TableCell>

            <TableCell className="tabular-nums text-sm">
                {endTime ? (
                    <span className="text-muted-foreground">{endTime}</span>
                ) : (
                    <Badge className="h-4 bg-orange-500 px-1.5 text-[10px] text-white hover:bg-orange-600">
                        Live
                    </Badge>
                )}
            </TableCell>

            <TableCell className="text-right">
                <span className={`tabular-nums font-semibold text-sm ${isActive ? "text-orange-600" : ""}`}>
                    {formatBreakDuration(duration)}
                </span>
            </TableCell>

            <TableCell className="max-w-40 truncate text-xs text-muted-foreground italic">
                {record.reason ? `"${record.reason}"` : <span className="not-italic">—</span>}
            </TableCell>
        </TableRow>
    );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function BreakStatsCard() {
    const { preset, dateRange, setPreset, setCustomRange } = useDateRangePresets("this-month");
    const [filterMode, setFilterMode]       = useState<FilterMode>("preset");
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue);

    const effectiveRange = useMemo(
        () => (filterMode === "monthly" ? monthToRange(selectedMonth) : dateRange),
        [filterMode, selectedMonth, dateRange],
    );

    const { data: response, isLoading } = useMyBreaks({
        startDate: effectiveRange.startDate,
        endDate:   effectiveRange.endDate,
    });

    const breaks  = response?.breaks || response?.data || [];
    const summary = useMemo(() => calculateBreakSummary(breaks), [breaks]);

    const stats = useMemo(() => {
        const completed   = breaks.filter((b) => b.endTime !== null);
        const workingDays = Math.max(1, Math.floor(
            (new Date(effectiveRange.endDate).getTime() - new Date(effectiveRange.startDate).getTime()) / 86_400_000 * 5 / 7,
        ));
        const avgDuration = completed.length > 0
            ? Math.round(summary.totalMinutes / completed.length)
            : 0;
        const avgPerDay = (completed.length / workingDays).toFixed(1);

        return { totalBreaks: summary.totalBreaks, totalMinutes: summary.totalMinutes, avgDuration, avgPerDay };
    }, [summary, breaks, effectiveRange]);

    // Sorted newest-first for the table
    const sortedBreaks = useMemo(
        () => [...breaks].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
        [breaks],
    );

    return (
        <div className="space-y-4">
            {/* ── Filter card ── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/40">
                            <Coffee className="size-4 text-orange-600" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold">Break History</CardTitle>
                            <CardDescription className="text-xs">
                                Filter by preset, pick a specific month, or set a custom date range
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <BreakDateRangeFilter
                        filterMode={filterMode}
                        setFilterMode={setFilterMode}
                        preset={preset}
                        dateRange={dateRange}
                        setPreset={setPreset}
                        setCustomRange={setCustomRange}
                        selectedMonth={selectedMonth}
                        setSelectedMonth={setSelectedMonth}
                    />
                </CardContent>
            </Card>

            {/* ── Summary metrics ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Breaks"
                    value={stats.totalBreaks}
                    subtitle="Breaks in selected period"
                    icon={Coffee}
                    iconColor="text-orange-600"
                    bgColor="bg-orange-50 dark:bg-orange-950/30"
                    loading={isLoading}
                />
                <MetricCard
                    title="Total Break Time"
                    value={formatBreakDuration(stats.totalMinutes)}
                    subtitle={stats.totalMinutes > 0 ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m accumulated` : "No completed breaks"}
                    icon={Clock}
                    iconColor="text-blue-600"
                    bgColor="bg-blue-50 dark:bg-blue-950/30"
                    loading={isLoading}
                />
                <MetricCard
                    title="Avg Duration"
                    value={formatBreakDuration(stats.avgDuration)}
                    subtitle="Per completed break"
                    icon={TrendingUp}
                    iconColor={stats.avgDuration <= 20 ? "text-emerald-600" : stats.avgDuration <= 40 ? "text-amber-600" : "text-red-600"}
                    bgColor={stats.avgDuration <= 20 ? "bg-emerald-50 dark:bg-emerald-950/30" : stats.avgDuration <= 40 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-red-50 dark:bg-red-950/30"}
                    loading={isLoading}
                />
                <MetricCard
                    title="Daily Average"
                    value={stats.avgPerDay}
                    subtitle="Breaks per working day"
                    icon={BarChart2}
                    iconColor="text-violet-600"
                    bgColor="bg-violet-50 dark:bg-violet-950/30"
                    loading={isLoading}
                />
            </div>

            {/* ── Records table ── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold">Records</CardTitle>
                            <CardDescription className="text-xs">
                                All break records sorted newest first
                            </CardDescription>
                        </div>
                        {!isLoading && sortedBreaks.length > 0 && (
                            <Badge variant="secondary" className="font-medium">
                                {sortedBreaks.length} record{sortedBreaks.length !== 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="mr-2 size-5 animate-spin" />
                            Loading records…
                        </div>
                    ) : sortedBreaks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                            <CalendarDays className="size-8 opacity-40" />
                            <p className="text-sm">No break records for this period.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                                        <TableHead className="font-semibold">Date</TableHead>
                                        <TableHead className="font-semibold">Type</TableHead>
                                        <TableHead className="font-semibold">Start</TableHead>
                                        <TableHead className="font-semibold">End</TableHead>
                                        <TableHead className="font-semibold text-right">Duration</TableHead>
                                        <TableHead className="font-semibold">Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedBreaks.map((record, idx) => (
                                        <BreakTableRow key={record.id} record={record} index={idx} />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
