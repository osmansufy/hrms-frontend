"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import {
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Loader2,
  CalendarRange,
  LayoutGrid,
  LogIn,
  LogOut,
} from "lucide-react";
import {
  useAttendanceRecords,
  useUpdateAttendanceRecord,
  useDeleteAttendanceRecord,
} from "@/lib/queries/attendance";
import { useDepartments } from "@/lib/queries/departments";
import { useEmployees } from "@/lib/queries/employees";
import {
  toStartOfDayISO,
  toEndOfDayISO,
  toLocalDateStr as toLocalStr,
  formatTimeInTimezone,
  formatDateInTimezone,
  formatMinutesToHours,
} from "@/lib/utils";
import {
  useDateRangePresets,
  DATE_RANGE_PRESETS,
  type DateRangePreset,
} from "@/hooks/useDateRangePresets";
import { useTimezone } from "@/contexts/timezone-context";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ExtendedAttendanceRecord } from "@/lib/api/attendance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { EmployeeLeaveBalanceDetails } from "@/components/employee-leave-balance-details";
import { Info } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MonthlySummaryCard } from "./monthly-summary-card";
import { BreakMonitorCard } from "./break-monitor-card";
import { useReverseGeocode } from "@/hooks/use-reverse-geocode";
const LIMITS = [10, 30, 50, 100];
const LIMITS_OPTIONS = LIMITS.map((limit) => ({
  label: limit.toString(),
  value: limit.toString(),
}));
// ── Monthly mode helpers ────────────────────────────────────────
type FilterMode = "preset" | "monthly";

function currentMonthValue() {
  return format(new Date(), "yyyy-MM");
}

function monthToRange(ym: string) {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  return { startDate: toLocalStr(start), endDate: toLocalStr(end) };
}

export function AttendanceRecordsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [employeeId, setEmployeeId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [limit, setLimit] = useState(30);

  // Date filter
  const { preset, dateRange, setPreset, setCustomRange } = useDateRangePresets("today");
  const [filterMode, setFilterMode] = useState<FilterMode>("preset");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue);

  const effectiveDateRange = useMemo(
    () => (filterMode === "monthly" ? monthToRange(selectedMonth) : dateRange),
    [filterMode, selectedMonth, dateRange],
  );

  const maxMonth = currentMonthValue();

  const { data: departments } = useDepartments();
  const { data: employees } = useEmployees();

  const queryParams = useMemo(
    () => ({
      page: page.toString(),
      limit: limit.toString(),
      search: search.trim() || undefined,
      departmentId: departmentId === "all" ? undefined : departmentId,
      userId: employeeId === "all" ? undefined : employeeId,
      startDate: toStartOfDayISO(effectiveDateRange.startDate),
      endDate: toEndOfDayISO(effectiveDateRange.endDate),
      isLate: statusFilter === "late" ? true : statusFilter === "ontime" ? false : undefined,
    }),
    [
      page,
      limit,
      search,
      departmentId,
      employeeId,
      effectiveDateRange.startDate,
      effectiveDateRange.endDate,
      statusFilter,
    ],
  );

  const { data: recordsData, isLoading } = useAttendanceRecords(queryParams);

  // Client-side filter for absent and on leave status (since backend doesn't have these filters)
  const filteredRecords = useMemo(() => {
    if (!recordsData?.data) return [];
    if (statusFilter === "absent") {
      return recordsData.data.filter((record) => !record.signIn && !record.isOnLeave);
    }
    if (statusFilter === "onleave") {
      return recordsData.data.filter((record) => record.isOnLeave === true);
    }
    return recordsData.data;
  }, [recordsData, statusFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value);
    setPage(1);
  };

  const handleEmployeeChange = (value: string) => {
    setEmployeeId(value);
    setPage(1);
  };

  const [selectedEmployee, setSelectedEmployee] = useState<{
    userId: string;
    name: string;
    record?: ExtendedAttendanceRecord;
  } | null>(null);

  // Use the record's own date for the monthly summary so it matches
  // what the admin is actually viewing, not the outer date range filter.
  const summaryYear = useMemo(() => {
    const dateStr = selectedEmployee?.record?.date ?? dateRange.startDate;
    const [y] = dateStr.split("-").map(Number);
    return y;
  }, [selectedEmployee?.record?.date, dateRange.startDate]);

  const summaryMonth = useMemo(() => {
    const dateStr = selectedEmployee?.record?.date ?? dateRange.startDate;
    const [, m] = dateStr.split("-").map(Number);
    return m;
  }, [selectedEmployee?.record?.date, dateRange.startDate]);

  // Month label for the monthly chip
  const monthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number) as [number, number];
    return format(new Date(y, m - 1, 1), "MMMM yyyy");
  }, [selectedMonth]);

  return (
    <>
      <div className="space-y-4">
        {/* ── Date range card ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarRange className="text-muted-foreground size-4" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Pill strip */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {DATE_RANGE_PRESETS.map((opt) => {
                const active = filterMode === "preset" && preset === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setFilterMode("preset");
                      setPreset(opt.value as DateRangePreset);
                      setPage(1);
                    }}
                    className={[
                      "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                      "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                );
              })}

              <div className="bg-border mx-1 w-px shrink-0 self-stretch" />

              {/* Monthly chip */}
              <button
                onClick={() => {
                  setFilterMode("monthly");
                  setPage(1);
                }}
                className={[
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  filterMode === "monthly"
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                ].join(" ")}
              >
                <LayoutGrid className="size-3 shrink-0" />
                {filterMode === "monthly" ? monthLabel : "Monthly"}
              </button>
            </div>

            {/* Monthly picker */}
            {filterMode === "monthly" && (
              <div className="bg-muted/30 flex items-end gap-3 rounded-lg border p-3">
                <div className="space-y-1">
                  <label className="text-muted-foreground text-xs font-medium">Select month</label>
                  <Input
                    type="month"
                    value={selectedMonth}
                    max={maxMonth}
                    className="h-8 w-44 text-sm"
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedMonth(e.target.value);
                        setPage(1);
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Custom date range */}
            {filterMode === "preset" && preset === "custom" && (
              <div className="bg-muted/30 grid grid-cols-2 gap-3 rounded-lg border p-3 sm:max-w-sm">
                <div className="space-y-1">
                  <label className="text-muted-foreground text-xs font-medium">From</label>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    max={format(new Date(), "yyyy-MM-dd")}
                    className="h-8 text-sm"
                    onChange={(e) => {
                      setCustomRange({ startDate: e.target.value });
                      setPage(1);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground text-xs font-medium">To</label>
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    max={format(new Date(), "yyyy-MM-dd")}
                    className="h-8 text-sm"
                    onChange={(e) => {
                      setCustomRange({ endDate: e.target.value });
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Active range readout */}
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <CalendarRange className="size-3.5 shrink-0" />
              <span className="text-foreground font-medium">
                {effectiveDateRange.startDate === effectiveDateRange.endDate
                  ? effectiveDateRange.startDate
                  : `${effectiveDateRange.startDate} – ${effectiveDateRange.endDate}`}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* ── Filters bar ── */}
        <div className="bg-card flex flex-wrap items-center gap-3 rounded-lg border p-3">
          {/* Search */}
          <div className="relative min-w-[180px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search name, email, code…"
              value={search}
              onChange={handleSearch}
              className="h-9 pl-8"
            />
          </div>

          <Select value={departmentId} onValueChange={handleDepartmentChange}>
            <SelectTrigger className="h-9 w-full sm:w-[160px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <EmployeeCombobox
            className="h-9 w-full sm:w-[180px]"
            value={employeeId}
            onValueChange={handleEmployeeChange}
            allLabel="All Employees"
            options={(employees ?? []).map((emp) => ({
              value: emp.userId || "",
              label: emp.name,
              code: emp.employeeCode,
            }))}
          />

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="ontime">On Time</SelectItem>
              <SelectItem value="onleave">On Leave</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={limit.toString()}
            onValueChange={(v) => {
              setLimit(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIMITS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold">Employee</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">
                  <span className="flex items-center gap-1">
                    <LogIn className="size-3.5" />
                    In
                  </span>
                </TableHead>
                <TableHead className="font-semibold">
                  <span className="flex items-center gap-1">
                    <LogOut className="size-3.5" />
                    Out
                  </span>
                </TableHead>
                <TableHead className="hidden font-semibold xl:table-cell">Location</TableHead>
                <TableHead className="text-right font-semibold">Lost</TableHead>
                <TableHead className="text-right font-semibold">OT</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-muted-foreground py-12 text-center">
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                    Loading records…
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-muted-foreground py-12 text-center text-sm"
                  >
                    No records found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record, idx) => {
                  const rowBg = idx % 2 !== 0 ? "bg-muted/20" : "";
                  const deptName = departments?.find(
                    (d) => d.id === record.user.employee?.departmentId,
                  )?.name;
                  return (
                    <TableRow
                      key={record.id}
                      className={`${rowBg} hover:bg-muted/40 transition-colors`}
                    >
                      {/* Employee */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8 shrink-0">
                            <AvatarImage src={record.user.employee?.profilePicture || undefined} />
                            <AvatarFallback className="text-xs">
                              {record.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <Link
                              href={`/dashboard/admin/employees/${record.user.employee?.id}`}
                              className="text-primary leading-tight font-medium hover:underline"
                            >
                              {record.user.name}
                            </Link>
                            <span className="text-muted-foreground text-xs">
                              {record.user.employee?.employeeCode}
                            </span>
                            {deptName && (
                              <span className="text-muted-foreground text-xs">{deptName}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateInTimezone(record.date)}
                      </TableCell>

                      {/* Sign in */}
                      <TableCell>
                        <span
                          className={`font-medium tabular-nums ${record.isLate ? "text-amber-600 dark:text-amber-400" : ""}`}
                        >
                          {record.signIn ? (
                            formatTime(record.signIn)
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </span>
                      </TableCell>

                      {/* Sign out */}
                      <TableCell>
                        <span className="text-muted-foreground tabular-nums">
                          {record.signOut ? formatTime(record.signOut) : "—"}
                        </span>
                      </TableCell>

                      {/* Location */}
                      <RecordsLocationCell record={record} />

                      {/* Lost */}
                      <TableCell className="text-right tabular-nums">
                        {record.lostMinutes != null && record.lostMinutes > 0 ? (
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {formatMinutesToHours(record.lostMinutes)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* OT */}
                      <TableCell className="text-right tabular-nums">
                        {record.overtimeMinutes != null && record.overtimeMinutes > 0 ? (
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            +{formatMinutesToHours(record.overtimeMinutes)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {!record.signIn ? (
                            record.isWeekend ? (
                              <Badge
                                variant="outline"
                                className="border-slate-300 bg-slate-50 text-xs text-slate-500 dark:bg-slate-900/40"
                              >
                                Weekend
                              </Badge>
                            ) : record.isOnLeave ? (
                              <Badge
                                variant="outline"
                                className="border-blue-300 bg-blue-50 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                              >
                                <CalendarDays className="mr-1 size-3" />
                                {record.leave?.leaveType.name ?? "On Leave"}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-red-300 bg-red-50 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400"
                              >
                                Absent
                              </Badge>
                            )
                          ) : record.isLate ? (
                            <Badge
                              variant="outline"
                              className="border-amber-300 bg-amber-50 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                            >
                              Late
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-emerald-300 bg-emerald-50 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            >
                              On Time
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() =>
                              setSelectedEmployee({
                                userId: record.user.id,
                                name: record.user.name,
                                record,
                              })
                            }
                            title="View employee details"
                          >
                            <Info className="size-4" />
                          </Button>
                          {record.signIn && <EditRecordDialog record={record} />}
                          {record.signIn && <DeleteRecordDialog record={record} />}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between py-2">
          <p className="text-muted-foreground text-sm">
            Page {page}
            {recordsData?.totalPages ? ` of ${recordsData.totalPages}` : ""}
            {recordsData?.total ? ` · ${recordsData.total} total records` : ""}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || isLoading}
            >
              <ArrowLeft className="mr-1.5 size-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={isLoading || !recordsData || recordsData.data.length < limit}
            >
              Next <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Employee Details Sheet */}
      <Sheet open={!!selectedEmployee} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
        <SheetContent className="w-full max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Employee Details</SheetTitle>
            <SheetDescription>
              {selectedEmployee?.name}&apos;s comprehensive attendance and leave information
            </SheetDescription>
          </SheetHeader>
          {selectedEmployee && (
            <div className="mt-6 space-y-6">
              {/* Monthly Attendance Summary for Employee */}
              <MonthlySummaryCard
                year={summaryYear}
                month={summaryMonth}
                userId={selectedEmployee.userId}
              />

              {/* Attendance Information */}
              {selectedEmployee.record && (
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Information</CardTitle>
                    <CardDescription>
                      Location and time details for this attendance record
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <SignSection
                        label="Sign In"
                        time={formatTime(selectedEmployee.record.signIn)}
                        address={selectedEmployee.record.signInAddress}
                        location={selectedEmployee.record.signInLocation}
                        pinColor="green"
                      />
                      <SignSection
                        label="Sign Out"
                        time={formatTime(selectedEmployee.record.signOut) || "—"}
                        address={selectedEmployee.record.signOutAddress}
                        location={selectedEmployee.record.signOutLocation}
                        pinColor="orange"
                      />
                    </div>

                    {/* Time Metrics */}
                    <div className="grid grid-cols-3 gap-4 border-t pt-4">
                      <TimeMetric
                        label="Lost Time"
                        minutes={selectedEmployee.record.lostMinutes}
                        colorClass="text-red-600 dark:text-red-400"
                      />
                      <TimeMetric
                        label="Overtime"
                        minutes={selectedEmployee.record.overtimeMinutes}
                        colorClass="text-green-600 dark:text-green-400"
                      />
                      <TimeMetric label="Worked" minutes={selectedEmployee.record.workedMinutes} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Break Monitoring - Only show if there's an attendance record with sign-in */}
              {selectedEmployee.record?.signIn && (
                <BreakMonitorCard
                  attendanceId={selectedEmployee.record.id}
                  employeeName={selectedEmployee.name}
                  signInTime={selectedEmployee.record.signIn}
                  signOutTime={selectedEmployee.record.signOut}
                />
              )}

              {/* Leave Balance Details */}
              <EmployeeLeaveBalanceDetails
                userId={selectedEmployee.userId}
                employeeName={selectedEmployee.name}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function SignSection({
  label,
  time,
  address,
  location,
  pinColor,
}: {
  label: string;
  time: string;
  address?: string | null;
  location?: string | null;
  pinColor: "green" | "orange";
}) {
  const pinClass =
    pinColor === "green"
      ? "text-green-600 dark:text-green-400"
      : "text-orange-600 dark:text-orange-400";
  const display = address || location;
  return (
    <div>
      <div className="text-muted-foreground mb-2 text-sm font-medium">{label}</div>
      <div className="space-y-2">
        <div className="text-sm">{time}</div>
        {display && (
          <div className="text-muted-foreground flex items-start gap-2 text-xs">
            <MapPin className={`h-3.5 w-3.5 ${pinClass} mt-0.5 shrink-0`} />
            <span>{display}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TimeMetric({
  label,
  minutes,
  colorClass = "",
}: {
  label: string;
  minutes?: number | null;
  colorClass?: string;
}) {
  return (
    <div>
      <div className="text-muted-foreground mb-1 text-sm font-medium">{label}</div>
      <div className={`text-lg font-semibold ${colorClass}`}>
        {minutes != null ? formatMinutesToHours(minutes) : "—"}
      </div>
    </div>
  );
}

function RecordsLocationCell({ record }: { record: ExtendedAttendanceRecord }) {
  const lat = record.signInLatitude ?? record.signOutLatitude;
  const lng = record.signInLongitude ?? record.signOutLongitude;

  // On-demand: don't auto-fetch, only when admin clicks
  const { data: geocodedAddress, isFetching, refetch } = useReverseGeocode(lat, lng, false);

  const effectiveAddress =
    record.signInAddress ||
    record.signOutAddress ||
    record.signInLocation ||
    record.signOutLocation ||
    geocodedAddress ||
    null;

  const hasLatLng = lat != null && lng != null;

  return (
    <TableCell className="max-w-xs">
      {effectiveAddress ? (
        <div className="flex items-center gap-1.5">
          <MapPin className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          <span className="text-muted-foreground truncate text-xs" title={effectiveAddress}>
            {effectiveAddress}
          </span>
        </div>
      ) : hasLatLng ? (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={isFetching}
          onClick={() => {
            if (!isFetching) {
              void refetch();
            }
          }}
        >
          {isFetching ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <MapPin className="mr-1 h-3 w-3" />
          )}
          Fetch address
        </Button>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )}
    </TableCell>
  );
}

function formatTime(isoString?: string | null) {
  return formatTimeInTimezone(isoString || "");
}

function EditRecordDialog({ record }: { record: ExtendedAttendanceRecord }) {
  const [open, setOpen] = useState(false);
  // Admin always works in system/business timezone — never employee device timezone
  const { timezone: systemTimezone } = useTimezone();
  const updateMutation = useUpdateAttendanceRecord();

  // Convert UTC time from DB to system timezone for display in input fields
  const getLocalTime = (utcIsoString?: string | null): string => {
    if (!utcIsoString) return "";
    return new Date(utcIsoString).toLocaleTimeString("en-US", {
      timeZone: systemTimezone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [signIn, setSignIn] = useState(getLocalTime(record.signIn));
  const [signOut, setSignOut] = useState(getLocalTime(record.signOut));
  const [isLate, setIsLate] = useState(record.isLate);

  const handleSave = async () => {
    try {
      if (!signIn) {
        toast.error("Sign-in time is required");
        return;
      }

      // Convert "HH:MM" entered in system timezone to a UTC ISO string.
      // fromZonedTime correctly handles all IANA timezones without hardcoded offsets.
      const localTimeToUTC = (timeStr: string, baseDate: Date): string => {
        const [hours, minutes] = timeStr.split(":").map(Number);

        // Resolve the calendar date in system timezone (record.date is UTC midnight)
        const datePart = new Intl.DateTimeFormat("en-CA", {
          timeZone: systemTimezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(baseDate);

        const localIso = `${datePart}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
        return fromZonedTime(localIso, systemTimezone).toISOString();
      };

      // Convert times to UTC ISO strings
      const signInIso = localTimeToUTC(signIn, new Date(record.date));

      let signOutIso: string | null = null;
      if (signOut) {
        const [signOutHour] = signOut.split(":").map(Number);
        signOutIso = localTimeToUTC(signOut, new Date(record.date));

        const signOutDate = new Date(signOutIso);
        const signInDate = new Date(signInIso);

        // Handle night shift (sign-out on next day if before 8 AM and before sign-in)
        if (signOutDate <= signInDate && signOutHour < 8) {
          const nextDay = new Date(record.date);
          nextDay.setUTCDate(nextDay.getUTCDate() + 1);
          signOutIso = localTimeToUTC(signOut, nextDay);
        } else if (signOutDate <= signInDate) {
          toast.error("Sign-out time must be after sign-in time");
          return;
        }

        // Validate 24-hour limit
        const diffMinutes = (new Date(signOutIso).getTime() - signInDate.getTime()) / (1000 * 60);
        if (diffMinutes > 24 * 60) {
          toast.error("Sign-out time cannot be more than 24 hours after sign-in");
          return;
        }
      }
      console.log({ signInIso, signOutIso });

      await updateMutation.mutateAsync({
        id: record.id,
        payload: {
          signIn: signInIso,
          signOut: signOutIso,
          isLate,
        },
      });
      toast.success("Record updated");
      setOpen(false);
    } catch (e: unknown) {
      console.error(e);
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to update record";
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Attendance</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Sign In</Label>
            <Input
              type="time"
              value={signIn}
              onChange={(e) => setSignIn(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Sign Out</Label>
            <Input
              type="time"
              value={signOut}
              onChange={(e) => setSignOut(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-right">Is Late</div>
            <Checkbox checked={isLate} onCheckedChange={(c) => setIsLate(!!c)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function DeleteRecordDialog({ record }: { record: ExtendedAttendanceRecord }) {
  const deleteMutation = useDeleteAttendanceRecord();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(record.id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the attendance record for {record.user.name} on{" "}
            {formatTimeInTimezone(record.date, false)}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
