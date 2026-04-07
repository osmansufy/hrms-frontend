"use client";

import { useMemo, useState } from "react";
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
import {
  CalendarRange,
  Loader2,
  Info,
  LogIn,
  LogOut,
  Timer,
  TrendingDown,
  TrendingUp,
  CalendarDays,
  LayoutGrid,
} from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { useMyLostHoursReport, useMyAttendanceRecords } from "@/lib/queries/attendance";
import {
  formatMinutesToHours,
  toStartOfDayISO,
  toEndOfDayISO,
  toLocalDateStr,
  formatTimeInTimezone,
  formatInDhakaTimezone,
  formatDateInDhaka,
} from "@/lib/utils";
import {
  useDateRangePresets,
  DATE_RANGE_PRESETS,
  type DateRangePreset,
} from "@/hooks/useDateRangePresets";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function formatTime(value?: string | null) {
  return formatTimeInTimezone(value || "");
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return formatInDhakaTimezone(value, { weekday: "short", month: "short", day: "numeric" });
}

function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

/** Returns the current month as "YYYY-MM" */
function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Converts "YYYY-MM" → { startDate, endDate } as "YYYY-MM-DD" strings */
function monthToRange(ym: string): { startDate: string; endDate: string } {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  const start = new Date(y, m - 1, 1);
  const end   = new Date(y, m, 0);          // last day of month
  return { startDate: toLocalDateStr(start), endDate: toLocalDateStr(end) };
}

// ──────────────────────────────────────────────────────────────
// Filter mode type
// ──────────────────────────────────────────────────────────────

type FilterMode = "preset" | "monthly";

// ──────────────────────────────────────────────────────────────
// Date Range Filter component
// ──────────────────────────────────────────────────────────────

function DateRangeFilter({
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
  const today        = new Date().toISOString().split("T")[0]!;
  const maxMonth     = currentMonthValue();

  const effectiveRange = filterMode === "monthly" ? monthToRange(selectedMonth) : dateRange;

  const rangeLabel = useMemo(() => {
    const { startDate, endDate } = effectiveRange;
    if (startDate === endDate) return formatDateInDhaka(startDate, "long");
    return `${formatDateInDhaka(startDate, "medium")} – ${formatDateInDhaka(endDate, "medium")}`;
  }, [effectiveRange]);

  const days = useMemo(
    () => daysBetween(effectiveRange.startDate, effectiveRange.endDate),
    [effectiveRange],
  );

  // Formatted label for the month picker chip  e.g. "April 2026"
  const monthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number) as [number, number];
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  function handlePresetClick(value: DateRangePreset) {
    setFilterMode("preset");
    setPreset(value);
  }

  function handleMonthlyClick() {
    setFilterMode("monthly");
  }

  return (
    <div className="space-y-3">

      {/* ── Pill strip ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {/* Standard preset chips */}
        {DATE_RANGE_PRESETS.map((option) => {
          const active = filterMode === "preset" && preset === option.value;
          return (
            <button
              key={option.value}
              onClick={() => handlePresetClick(option.value as DateRangePreset)}
              className={[
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}

        {/* Separator */}
        <div className="mx-1 self-stretch w-px bg-border shrink-0" />

        {/* Monthly chip — shows selected month label when active */}
        <button
          onClick={handleMonthlyClick}
          className={[
            "shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
            "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            filterMode === "monthly"
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
          ].join(" ")}
        >
          <LayoutGrid className="size-3 shrink-0" />
          {filterMode === "monthly" ? monthLabel : "Monthly"}
        </button>
      </div>

      {/* ── Expanded panels ── */}

      {/* Monthly picker */}
      {filterMode === "monthly" && (
        <div className="flex items-end gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Select month</label>
            <Input
              type="month"
              value={selectedMonth}
              max={maxMonth}
              className="h-8 w-44 text-sm"
              onChange={(e) => {
                if (e.target.value) setSelectedMonth(e.target.value);
              }}
            />
          </div>
          <p className="pb-1 text-xs text-muted-foreground">
            Showing full month · {days} days
          </p>
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

      {/* Active range readout */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarRange className="size-3.5 shrink-0" />
        <span>
          <span className="font-medium text-foreground">{rangeLabel}</span>
          <span className="ml-1.5">
            ({days} {days === 1 ? "day" : "days"})
          </span>
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Summary metric card
// ──────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor,
  valueColor,
  tooltip,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  valueColor?: string;
  tooltip?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          {label}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </span>
        <Icon className={`size-4 ${iconColor}`} />
      </div>
      {loading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <p className={`text-2xl font-bold tracking-tight ${valueColor ?? ""}`}>{value}</p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────

export function ComprehensiveHistoryTab() {
  const { session } = useSession();
  const userId = session?.user.id;

  // Preset-based filter (the existing hook)
  const { preset, dateRange, setPreset, setCustomRange } = useDateRangePresets("today");

  // Monthly filter state
  const [filterMode, setFilterMode]     = useState<FilterMode>("preset");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue);

  // Effective date range — monthly mode overrides the preset
  const effectiveDateRange = useMemo(() => {
    if (filterMode === "monthly") return monthToRange(selectedMonth);
    return dateRange;
  }, [filterMode, selectedMonth, dateRange]);

  const queryParams = useMemo(
    () => ({
      startDate: toStartOfDayISO(effectiveDateRange.startDate),
      endDate:   toEndOfDayISO(effectiveDateRange.endDate),
    }),
    [effectiveDateRange],
  );

  const attendanceParams = useMemo(
    () => ({
      startDate: toStartOfDayISO(effectiveDateRange.startDate),
      endDate:   toEndOfDayISO(effectiveDateRange.endDate),
      limit: "100",
    }),
    [effectiveDateRange],
  );

  const { data: lostHoursData, isFetching: isLoadingLostHours } =
    useMyLostHoursReport(userId, queryParams);
  const { data: attendanceData, isLoading: isLoadingAttendance } =
    useMyAttendanceRecords(userId, attendanceParams);

  const myData = useMemo(
    () => lostHoursData?.find((r) => r.userId === userId),
    [lostHoursData, userId],
  );

  const records = attendanceData?.data ?? [];

  const coveredLostHours = Math.min(
    myData?.totalLostMinutes ?? 0,
    myData?.totalOvertimeMinutes ?? 0,
  );

  const dailyRecords = useMemo(
    () =>
      records.map((record) => ({
        id:              record.id,
        date:            record.date,
        signIn:          record.signIn,
        signOut:         record.signOut,
        isLate:          record.isLate,
        workedMinutes:   record.workedMinutes ?? 0,
        lostMinutes:     record.lostMinutes ?? 0,
        overtimeMinutes: record.overtimeMinutes ?? 0,
        isWeekend:       record.isWeekend,
      })),
    [records],
  );

  const isLoading = isLoadingLostHours || isLoadingAttendance;

  return (
    <div className="space-y-5">

      {/* ── Date range filter card ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-muted-foreground" />
            Attendance History
          </CardTitle>
          <CardDescription>
            Filter by preset, pick a specific month, or set a custom date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DateRangeFilter
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
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Days Worked"
          value={String(myData?.days ?? 0)}
          icon={CalendarDays}
          iconColor="text-blue-500"
          loading={isLoading}
        />
        <MetricCard
          label="Total Worked"
          value={formatMinutesToHours(myData?.totalWorkedMinutes ?? 0)}
          icon={Timer}
          iconColor="text-emerald-500"
          valueColor="text-emerald-700 dark:text-emerald-400"
          loading={isLoading}
        />
        <MetricCard
          label="Lost Hours"
          value={formatMinutesToHours(myData?.totalLostMinutes ?? 0)}
          icon={TrendingDown}
          iconColor="text-red-500"
          valueColor={(myData?.totalLostMinutes ?? 0) > 0 ? "text-red-600 dark:text-red-400" : ""}
          loading={isLoading}
        />
        <MetricCard
          label="Covered by OT"
          value={formatMinutesToHours(coveredLostHours)}
          icon={TrendingUp}
          iconColor="text-violet-500"
          valueColor="text-violet-700 dark:text-violet-400"
          tooltip="Lost hours offset by overtime worked in the same period. Cannot exceed actual lost hours."
          loading={isLoading}
        />
      </div>

      {/* ── Attendance records table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Records</CardTitle>
          <CardDescription>
            Daily sign-in / sign-out with worked hours, lost time, and overtime
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Loading records…
            </div>
          ) : dailyRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <CalendarRange className="size-8 opacity-40" />
              <p className="text-sm">No attendance records for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">
                      <span className="flex items-center gap-1.5">
                        <LogIn className="size-3.5" /> In
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <span className="flex items-center gap-1.5">
                        <LogOut className="size-3.5" /> Out
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Worked</TableHead>
                    <TableHead className="font-semibold text-right">Lost</TableHead>
                    <TableHead className="font-semibold text-right">OT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyRecords.map((record, idx) => {
                    const isWeekend = record.isWeekend;
                    const rowBg = isWeekend
                      ? "bg-slate-50/60 dark:bg-slate-900/20"
                      : idx % 2 !== 0
                      ? "bg-muted/20"
                      : "";

                    return (
                      <TableRow
                        key={record.id}
                        className={`${rowBg} hover:bg-muted/40 transition-colors`}
                      >
                        <TableCell className="font-medium">
                          <span className={isWeekend ? "text-muted-foreground" : ""}>
                            {formatDate(record.date)}
                          </span>
                        </TableCell>

                        <TableCell>
                          {record.signIn ? (
                            <span className={`font-medium tabular-nums ${record.isLate ? "text-amber-600 dark:text-amber-400" : ""}`}>
                              {formatTime(record.signIn)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span className="tabular-nums text-muted-foreground">
                            {record.signOut ? formatTime(record.signOut) : "—"}
                          </span>
                        </TableCell>

                        <TableCell>
                          {!record.signIn ? (
                            isWeekend ? (
                              <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-500 dark:bg-slate-900/40 text-xs">
                                Weekend
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-red-300 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 text-xs">
                                Absent
                              </Badge>
                            )
                          ) : record.isLate ? (
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 text-xs">
                              Late
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-xs">
                              On Time
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right tabular-nums font-medium">
                          {record.workedMinutes > 0
                            ? formatMinutesToHours(record.workedMinutes)
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>

                        <TableCell className="text-right tabular-nums">
                          {record.lostMinutes > 0 ? (
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {formatMinutesToHours(record.lostMinutes)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right tabular-nums">
                          {record.overtimeMinutes > 0 ? (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              +{formatMinutesToHours(record.overtimeMinutes)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
