"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminLedgerHistory, useLeaveTypesAdmin } from "@/lib/queries/leave";
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
} from "lucide-react";

const currentYear = new Date().getUTCFullYear();

const MAX_DESCRIPTION_LENGTH = 30;

function formatDescription(text?: string | null): string {
  if (!text) return "—";
  if (text.length <= MAX_DESCRIPTION_LENGTH) return text;
  return `${text.slice(0, MAX_DESCRIPTION_LENGTH)}...`;
}

export function LeaveLedgerTab() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [year, setYear] = useState<number | "all">(currentYear);
  const [departmentId, setDepartmentId] = useState<string | "all">("all");
  const [leaveTypeId, setLeaveTypeId] = useState<string | "all">("all");
  const [transactionType, setTransactionType] = useState<string | "all">("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const debouncedSearch = useDebounce(search.trim(), 500);

  const { data: departments } = useDepartments();
  const { data: leaveTypes } = useLeaveTypesAdmin({ isActive: true });

  const { data, isLoading, error } = useAdminLedgerHistory({
    page,
    pageSize,
    leaveYear: year === "all" ? undefined : (year as number),
    departmentId: departmentId === "all" ? undefined : departmentId,
    leaveTypeId: leaveTypeId === "all" ? undefined : leaveTypeId,
    transactionType: transactionType === "all" ? undefined : transactionType,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    search: debouncedSearch || undefined,
  });

  if (isLoading) {
    return <LeaveLedgerSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Ledger History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load leave ledger history. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const entries: LedgerEntry[] = data?.data ?? [];
  const pagination = data?.pagination;

  if (!entries.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            No Ledger Entries Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No ledger entries match your current filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee, code, type, description, reference..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>

            <Select
              value={departmentId}
              onValueChange={(value) => {
                setDepartmentId(value as typeof departmentId);
                setPage(1);
              }}
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

            <Select
              value={leaveTypeId}
              onValueChange={(value) => {
                setLeaveTypeId(value as typeof leaveTypeId);
                setPage(1);
              }}
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

            <Select
              value={transactionType}
              onValueChange={(value) => {
                setTransactionType(value as typeof transactionType);
                setPage(1);
              }}
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
                <SelectItem value="RECONCILIATION_REVERSAL">
                  Reconciliation Reversal
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={year === "all" ? "all" : String(year)}
              onValueChange={(value) => {
                setYear(value === "all" ? "all" : parseInt(value, 10));
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {pagination && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, pagination.totalCount)} of{" "}
                {pagination.totalCount} entries
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
                <div className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) =>
                      pagination ? Math.min(pagination.totalPages, p + 1) : p + 1,
                    )
                  }
                  disabled={pagination ? page >= pagination.totalPages : true}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry: LedgerEntry) => {
                  const isDebit = entry.days < 0;
                  return (
                    <TableRow key={entry.id}>
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
                        {entry.user?.name || "N/A"}
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
                        <Badge
                          variant={isDebit ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {entry.transactionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            isDebit
                              ? "text-red-600 font-semibold"
                              : "text-green-600 font-semibold"
                          }
                        >
                          {entry.days > 0 ? "+" : ""}
                          {entry.days}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span
                          className="text-sm truncate"
                          title={entry.description || undefined}
                        >
                          {formatDescription(entry.description)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs text-muted-foreground">
                          <span>{entry.referenceType || "—"}</span>
                          <span className="font-mono">{entry.referenceId || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.createdBy ? (
                          <div className="flex flex-col">
                            <span className="text-sm">{entry.createdBy.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {entry.createdBy.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">System</span>
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
    </div>
  );
}

function LeaveLedgerSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

