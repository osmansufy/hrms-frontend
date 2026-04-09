"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { useManagerSubordinates } from "@/lib/queries/employees";
import { useSubordinateBreaks } from "@/lib/queries/attendance";
import {
  BreakType,
  formatBreakDuration,
  getBreakTypeLabel,
} from "@/lib/api/attendance";

function formatTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function toYYYYMMDD(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function monthToRange(month: string): { startDate: string; endDate: string } | null {
  // month is "YYYY-MM" from <input type="month" />
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null;
  const [y, m] = month.split("-").map((x) => Number(x));
  if (!y || !m) return null;
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0); // last day of month
  return { startDate: toYYYYMMDD(start), endDate: toYYYYMMDD(end) };
}

export function TeamBreakRecordsTab() {
  const {
    data: managerSubordinates,
    isLoading: isSubordinatesLoading,
    error: subordinatesError,
  } = useManagerSubordinates();

  const options = useMemo(() => {
    return (managerSubordinates ?? []).map((s) => ({
      id: s.userId || s.id, // userId is what attendance/break tables use
      label: `${s.firstName} ${s.lastName}`,
    }));
  }, [managerSubordinates]);

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"monthly" | "datewise">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedBreakType, setSelectedBreakType] = useState<BreakType | "ALL">("ALL");

  // Auto-select first subordinate
  useEffect(() => {
    if (!selectedUserId && options.length > 0) {
      setSelectedUserId(options[0]!.id);
    }
  }, [options, selectedUserId]);

  // Default month = current month
  useEffect(() => {
    if (selectedMonth) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${yyyy}-${mm}`);
  }, [selectedMonth]);

  const computedRange = useMemo(() => {
    if (filterMode === "monthly") {
      return monthToRange(selectedMonth);
    }
    if (startDate || endDate) {
      return {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
    }
    return null;
  }, [filterMode, selectedMonth, startDate, endDate]);

  const queryParams = useMemo(() => {
    const p: {
      page: number;
      limit: number;
      startDate?: string;
      endDate?: string;
      breakType?: BreakType;
    } = { page: 1, limit: 50 };

    if (computedRange && "startDate" in computedRange) {
      if (computedRange.startDate) p.startDate = computedRange.startDate;
      if (computedRange.endDate) p.endDate = computedRange.endDate;
    }
    if (selectedBreakType !== "ALL") {
      p.breakType = selectedBreakType;
    }
    return p;
  }, [computedRange, selectedBreakType]);

  const { data, isLoading, error } = useSubordinateBreaks(
    selectedUserId || undefined,
    queryParams,
  );

  if (isSubordinatesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Break Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subordinatesError || !managerSubordinates || managerSubordinates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Break Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No team members found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Break Records</CardTitle>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="text-sm text-muted-foreground">Team member</div>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full sm:w-[320px]">
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <div className="text-sm text-muted-foreground">Filter</div>
              <Select
                value={filterMode}
                onValueChange={(v) => setFilterMode(v as "monthly" | "datewise")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="datewise">Date wise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-sm text-muted-foreground">Break type</div>
              <Select
                value={selectedBreakType}
                onValueChange={(v) =>
                  setSelectedBreakType(v === "ALL" ? "ALL" : (v as BreakType))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {Object.values(BreakType).map((bt) => (
                    <SelectItem key={bt} value={bt}>
                      {getBreakTypeLabel(bt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-sm text-muted-foreground">
                {filterMode === "monthly" ? "Month" : "Date range"}
              </div>
              {filterMode === "monthly" ? (
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-muted-foreground">
            Failed to load break records.
          </p>
        ) : !data || data.data.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No break records found for this team member.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[110px]">Type</TableHead>
                  <TableHead className="min-w-[200px]">Start</TableHead>
                  <TableHead className="min-w-[200px]">End</TableHead>
                  <TableHead className="min-w-[110px]">Duration</TableHead>
                  <TableHead className="min-w-[160px]">Attendance Date</TableHead>
                  <TableHead className="min-w-[240px]">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((b: any) => {
                  const duration =
                    typeof b.durationMinutes === "number"
                      ? formatBreakDuration(b.durationMinutes)
                      : "—";
                  const breakType = (b.breakType as BreakType) ?? BreakType.OTHER;
                  const reason = b.reason ?? "—";
                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <Badge variant="secondary">
                          {getBreakTypeLabel(breakType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTime(b.startTime)}</TableCell>
                      <TableCell>{formatTime(b.endTime)}</TableCell>
                      <TableCell>{duration}</TableCell>
                      <TableCell>
                        {b.attendance?.date ? formatTime(b.attendance.date) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {reason}
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
  );
}

