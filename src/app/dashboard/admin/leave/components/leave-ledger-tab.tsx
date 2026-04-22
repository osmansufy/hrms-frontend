"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  EmployeeCombobox,
  type EmployeeOption,
} from "@/components/ui/employee-combobox";
import {
  useAdminLedgerHistory,
  useLeaveTypesAdmin,
} from "@/lib/queries/leave";
import { useEmployees } from "@/lib/queries/employees";
import { useDepartments } from "@/lib/queries/departments";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatDateInDhaka, formatTimeInTimezone } from "@/lib/utils";
import type { LedgerEntry } from "@/lib/api/leave";
import type { Department } from "@/lib/api/departments";
import type { LeaveTypeWithStats } from "@/lib/api/leave";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  AlertTriangle,
  RotateCcw,
  Info,
  X,
  FilterX,
} from "lucide-react";
import { ReverseLedgerEntryDialog } from "./reverse-ledger-entry-dialog";

const NON_REVERSIBLE_TYPES = new Set([
  "ADMIN_CORRECTION_REVERSAL",
  "RECONCILIATION_REVERSAL",
]);

const currentYear = new Date().getUTCFullYear();

const MAX_DESCRIPTION_LENGTH = 30;

function formatDescription(text?: string | null): string {
  if (!text) return "—";
  if (text.length <= MAX_DESCRIPTION_LENGTH) return text;
  return `${text.slice(0, MAX_DESCRIPTION_LENGTH)}...`;
}

const DEFAULT_FILTERS = {
  year: currentYear as number | "all",
  departmentId: "all" as string | "all",
  leaveTypeId: "all" as string | "all",
  transactionType: "all" as string | "all",
  userId: "all" as string | "all",
  search: "",
  startDate: "",
  endDate: "",
};

export function LeaveLedgerTab() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [year, setYear] = useState<number | "all">(DEFAULT_FILTERS.year);
  const [departmentId, setDepartmentId] = useState<string | "all">(DEFAULT_FILTERS.departmentId);
  const [leaveTypeId, setLeaveTypeId] = useState<string | "all">(DEFAULT_FILTERS.leaveTypeId);
  const [transactionType, setTransactionType] = useState<string | "all">(DEFAULT_FILTERS.transactionType);
  const [userId, setUserId] = useState<string | "all">(DEFAULT_FILTERS.userId);
  const [search, setSearch] = useState(DEFAULT_FILTERS.search);
  const [startDate, setStartDate] = useState(DEFAULT_FILTERS.startDate);
  const [endDate, setEndDate] = useState(DEFAULT_FILTERS.endDate);
  const [reverseEntry, setReverseEntry] = useState<LedgerEntry | null>(null);

  const debouncedSearch = useDebounce(search.trim(), 300);

  const { data: departments } = useDepartments();
  const { data: leaveTypes } = useLeaveTypesAdmin({ isActive: true });
  const { data: employees } = useEmployees({
    departmentId: departmentId !== "all" ? departmentId : undefined,
  });

  const { data, isLoading, error } = useAdminLedgerHistory({
    page,
    pageSize,
    leaveYear: year === "all" ? undefined : (year as number),
    departmentId: departmentId === "all" ? undefined : departmentId,
    leaveTypeId: leaveTypeId === "all" ? undefined : leaveTypeId,
    transactionType: transactionType === "all" ? undefined : transactionType,
    userId: userId === "all" ? undefined : userId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    search: debouncedSearch || undefined,
  });

  const employeeOptions: EmployeeOption[] = (employees ?? [])
    .filter((emp) => !!emp.userId)
    .map((emp) => ({
      value: emp.userId as string,
      label: emp.name,
      code: emp.employeeCode,
      department: emp.department !== "—" ? emp.department : undefined,
    }));

  const activeFilterCount = [
    year !== "all",
    departmentId !== "all",
    leaveTypeId !== "all",
    transactionType !== "all",
    userId !== "all",
    !!search,
    !!startDate,
    !!endDate,
  ].filter(Boolean).length;

  function resetFilters() {
    setYear(DEFAULT_FILTERS.year);
    setDepartmentId(DEFAULT_FILTERS.departmentId);
    setLeaveTypeId(DEFAULT_FILTERS.leaveTypeId);
    setTransactionType(DEFAULT_FILTERS.transactionType);
    setUserId(DEFAULT_FILTERS.userId);
    setSearch(DEFAULT_FILTERS.search);
    setStartDate(DEFAULT_FILTERS.startDate);
    setEndDate(DEFAULT_FILTERS.endDate);
    setPage(1);
  }

  function changeDepartment(value: string | "all") {
    setDepartmentId(value as typeof departmentId);
    setUserId("all");
    setPage(1);
  }

  const entries: LedgerEntry[] = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          {/* Row 1: search + employee + department + leave type */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search with clear */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Employee name, code, description, reference…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-8"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setPage(1); }}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Employee filter */}
            <EmployeeCombobox
              options={employeeOptions}
              value={userId}
              onValueChange={(val) => { setUserId(val); setPage(1); }}
              placeholder="All Employees"
              allLabel="All Employees"
            />

            {/* Department */}
            <Select
              value={departmentId}
              onValueChange={changeDepartment}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments?.map((dept: Department) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Leave Type */}
            <Select
              value={leaveTypeId}
              onValueChange={(val) => { setLeaveTypeId(val as typeof leaveTypeId); setPage(1); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Leave Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leave Types</SelectItem>
                {leaveTypes?.map((lt: LeaveTypeWithStats) => (
                  <SelectItem key={lt.id} value={lt.id}>
                    {lt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 2: transaction + year + dates + reset */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {/* Transaction Type */}
            <Select
              value={transactionType}
              onValueChange={(val) => { setTransactionType(val as typeof transactionType); setPage(1); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Transactions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="OPENING">Opening</SelectItem>
                <SelectItem value="ACCRUAL">Accrual</SelectItem>
                <SelectItem value="LEAVE_APPROVED">Leave Approved</SelectItem>
                <SelectItem value="LEAVE_DEDUCTION">Leave Deduction</SelectItem>
                <SelectItem value="LEAVE_CANCELLED">Leave Cancelled</SelectItem>
                <SelectItem value="CARRY_FORWARD">Carry Forward</SelectItem>
                <SelectItem value="LAPSE">Lapse</SelectItem>
                <SelectItem value="ENCASHMENT">Encashment</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                <SelectItem value="AMENDMENT_DEBIT">Amendment Debit</SelectItem>
                <SelectItem value="AMENDMENT_CREDIT">Amendment Credit</SelectItem>
                <SelectItem value="RECONCILIATION_REVERSAL">Reconciliation Reversal</SelectItem>
                <SelectItem value="ADMIN_CORRECTION_REVERSAL">Admin Correction Reversal</SelectItem>
              </SelectContent>
            </Select>

            {/* Year */}
            <Select
              value={year === "all" ? "all" : String(year)}
              onValueChange={(val) => { setYear(val === "all" ? "all" : parseInt(val, 10)); setPage(1); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date range */}
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              placeholder="From"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              placeholder="To"
            />

            {/* Reset */}
            <Button
              variant="outline"
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
              className="gap-2"
            >
              <FilterX className="h-4 w-4" />
              Reset
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Pagination summary */}
          {pagination && !isLoading && !error && (
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-1 border-t">
              <span>
                {pagination.totalCount === 0
                  ? "No entries found"
                  : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, pagination.totalCount)} of ${pagination.totalCount} entries`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm tabular-nums">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <LeaveLedgerSkeleton />
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Error Loading Ledger History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Failed to load leave ledger history. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ListOrdered className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No ledger entries match your current filters.</p>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="mt-2 gap-1">
                <FilterX className="h-4 w-4" /> Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5" />
              Ledger History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead className="text-right">Days</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry: LedgerEntry) => {
                    const isDebit = entry.days < 0;
                    const isReversalEntry =
                      entry.transactionType === "ADMIN_CORRECTION_REVERSAL" ||
                      entry.transactionType === "RECONCILIATION_REVERSAL";
                    const isReversed = entry.isReversed === true;
                    const meta = entry.metadata as Record<string, any> | null;
                    // Normalise: admin-ledger path uses `originalEntryId`, attendance path uses `originalLedgerId`
                    const originalRef = meta?.originalEntryId || meta?.originalLedgerId;
                    const hasReversalMeta = isReversalEntry && !!originalRef;
                    return (
                      <TableRow
                        key={entry.id}
                        className={isReversed ? "opacity-50" : undefined}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {formatDateInDhaka(entry.effectiveDate, "long")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeInTimezone(entry.effectiveDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {entry.user?.employee
                                ? `${entry.user.employee.firstName} ${entry.user.employee.lastName}`
                                : entry.user?.name || entry.user?.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {entry.user?.employee?.employeeCode}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.user?.employee?.department?.name || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{entry.leaveType?.name}</span>
                            {entry.leaveType?.code && (
                              <Badge variant="outline" className="text-xs">
                                {entry.leaveType.code}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={isDebit ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {entry.transactionType}
                              </Badge>
                              {hasReversalMeta && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                                      <Info className="h-3.5 w-3.5" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent side="right" align="start" className="w-72 text-sm">
                                    <div className="space-y-2">
                                      <p className="font-semibold text-orange-600 flex items-center gap-1.5">
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        {entry.transactionType === "RECONCILIATION_REVERSAL"
                                          ? "Reconciliation Reversal"
                                          : "Admin Correction Reversal"}
                                      </p>
                                      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                                        {/* Admin-ledger reversal fields */}
                                        {meta?.originalTransactionType && (
                                          <>
                                            <span className="text-muted-foreground">Reversed type</span>
                                            <span className="font-mono font-semibold">{meta.originalTransactionType}</span>
                                          </>
                                        )}
                                        {meta?.originalDays !== undefined && (
                                          <>
                                            <span className="text-muted-foreground">Original days</span>
                                            <span className={meta.originalDays > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                              {meta.originalDays > 0 ? "+" : ""}{meta.originalDays}
                                            </span>
                                          </>
                                        )}
                                        {meta?.originalEffectiveDate && (
                                          <>
                                            <span className="text-muted-foreground">Original date</span>
                                            <span>{formatDateInDhaka(meta.originalEffectiveDate, "long")}</span>
                                          </>
                                        )}
                                        {/* Attendance reversal fields */}
                                        {meta?.reversalDate && (
                                          <>
                                            <span className="text-muted-foreground">Reversal date</span>
                                            <span>{formatDateInDhaka(meta.reversalDate, "long")}</span>
                                          </>
                                        )}
                                        {meta?.source && (
                                          <>
                                            <span className="text-muted-foreground">Source</span>
                                            <span className="capitalize">{String(meta.source).replace("_", " ")}</span>
                                          </>
                                        )}
                                        {meta?.originalAttendanceId && (
                                          <>
                                            <span className="text-muted-foreground">Attendance ID</span>
                                            <span className="font-mono break-all">{String(meta.originalAttendanceId).slice(0, 8)}…</span>
                                          </>
                                        )}
                                        {/* Common fields */}
                                        <>
                                          <span className="text-muted-foreground">Entry ID</span>
                                          <span className="font-mono break-all">{String(originalRef).slice(0, 8)}…</span>
                                        </>
                                        {meta?.reason && (
                                          <>
                                            <span className="text-muted-foreground">Reason</span>
                                            <span className="break-words">{meta.reason}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                            {isReversed && (
                              <Badge variant="outline" className="text-xs w-fit border-orange-400 text-orange-600">
                                Reversed
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={isDebit ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                            {entry.days > 0 ? "+" : ""}{entry.days}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <span className="text-sm truncate" title={entry.description || undefined}>
                            {formatDescription(entry.description)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {hasReversalMeta ? (
                            <div className="flex flex-col text-xs">
                              <span className="text-muted-foreground">
                                {entry.transactionType === "RECONCILIATION_REVERSAL" ? "SYSTEM" : "MANUAL"}
                              </span>
                              <span
                                className="font-mono text-orange-600 truncate max-w-[120px]"
                                title={`Reverses: ${originalRef}`}
                              >
                                ↩ {String(originalRef).slice(0, 8)}…
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col text-xs text-muted-foreground">
                              <span>{entry.referenceType || "—"}</span>
                              <span className="font-mono">{entry.referenceId || ""}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.createdBy ? (
                            <div className="flex flex-col">
                              <span className="text-sm">{entry.createdBy.name}</span>
                              <span className="text-xs text-muted-foreground">{entry.createdBy.email}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {NON_REVERSIBLE_TYPES.has(entry.transactionType) ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                    onClick={() => !isReversed && setReverseEntry(entry)}
                                    disabled={isReversed}
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  {isReversed ? "Already reversed" : "Reverse this entry"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <ReverseLedgerEntryDialog
        entry={reverseEntry}
        open={reverseEntry !== null}
        onOpenChange={(open) => { if (!open) setReverseEntry(null); }}
      />
    </div>
  );
}

function LeaveLedgerSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
