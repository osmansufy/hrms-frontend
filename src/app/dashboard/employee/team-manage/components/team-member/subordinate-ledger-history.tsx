"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubordinateBalances, useSubordinateLedgerHistory } from "@/lib/queries/leave";
import { useSession } from "@/components/auth/session-provider";
import { formatDateInDhaka } from "@/lib/utils";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  PlusCircle,
  AlertCircle,
  Calendar,
  History,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { LedgerEntry } from "@/lib/api/leave";

interface SubordinateLedgerHistoryProps {
  userId: string;
}

export function SubordinateLedgerHistory({ userId }: SubordinateLedgerHistoryProps) {
  const { session } = useSession();
  const managerUserId = session?.user?.id || "";
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const currentYear = new Date().getFullYear();
  const [leaveYear, setLeaveYear] = useState(currentYear);
  const [transactionType, setTransactionType] = useState<string>("ALL");

  const { data: balancesResponse, isLoading: balancesLoading } = useSubordinateBalances(managerUserId, userId);
  const balances = balancesResponse?.data || [];

  const {
    data: ledgerResponse,
    isLoading: ledgerLoading,
    error,
  } = useSubordinateLedgerHistory(userId, selectedLeaveTypeId, {
    page,
    pageSize,
    leaveYear,
    transactionType: transactionType === "ALL" ? undefined : transactionType,
  });

  const ledgerEntries = ledgerResponse?.data || [];
  const pagination = ledgerResponse?.pagination;

  const getTransactionIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "OPENING":
        return <PlusCircle className="h-4 w-4 text-blue-600" />;
      case "ACCRUAL":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "USAGE":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "ADJUSTMENT":
        return <MinusCircle className="h-4 w-4 text-orange-600" />;
      case "CARRYFORWARD":
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case "LAPSE":
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case "OPENING":
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            Opening
          </Badge>
        );
      case "ACCRUAL":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800">
            Accrual
          </Badge>
        );
      case "USAGE":
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800">
            Usage
          </Badge>
        );
      case "ADJUSTMENT":
        return (
          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800">
            Adjustment
          </Badge>
        );
      case "CARRYFORWARD":
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800">
            Carry Forward
          </Badge>
        );
      case "LAPSE":
        return (
          <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700">
            Lapsed
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDays = (days: number) => {
    const absValue = Math.abs(days);
    const prefix = days > 0 ? "+" : days < 0 ? "-" : "";
    return `${prefix}${absValue.toFixed(2)}`;
  };

  if (balancesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ledger History</CardTitle>
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

  const handleLeaveTypeChange = (value: string) => {
    setSelectedLeaveTypeId(value);
    setPage(1); // Reset to first page when changing leave type
  };

  const handleYearChange = (value: string) => {
    setLeaveYear(Number(value));
    setPage(1); // Reset to first page when changing year
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1); // Reset to first page when changing page size
  };

  const handleTransactionTypeChange = (value: string) => {
    setTransactionType(value);
    setPage(1); // Reset to first page when changing transaction type
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <CardTitle>Leave Ledger History</CardTitle>
            </div>
            <CardDescription>
              View detailed transaction history for leave balances
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters Section */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Leave Type Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Leave Type
              </label>
              <Select value={selectedLeaveTypeId} onValueChange={handleLeaveTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {balances && balances.length > 0 ? (
                    balances.map((balance) => (
                      <SelectItem key={balance.leaveTypeId} value={balance.leaveTypeId}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{balance.leaveTypeName}</span>
                          <span className="text-xs text-muted-foreground">
                            ({balance.leaveTypeCode})
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No leave types available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Year Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Leave Year
              </label>
              <Select value={leaveYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transaction Type Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Transaction Type
              </label>
              <Select value={transactionType} onValueChange={handleTransactionTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Transactions</SelectItem>
                  <SelectItem value="OPENING">Opening</SelectItem>
                  <SelectItem value="ACCRUAL">Accrual</SelectItem>
                  <SelectItem value="LEAVE_APPROVED">Usage</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="CARRY_FORWARD">Carry Forward</SelectItem>
                  <SelectItem value="LAPSE">Lapse</SelectItem>
                  <SelectItem value="LEAVE_CANCELLED">Leave Cancelled</SelectItem>
                  <SelectItem value="AMENDMENT_CREDIT">Amendment Credit</SelectItem>
                  <SelectItem value="AMENDMENT_DEBIT">Amendment Debit</SelectItem>
                  <SelectItem value="ENCASHMENT">Encashment</SelectItem>
                  <SelectItem value="LEAVE_DEDUCTION">Leave Deduction</SelectItem>
                  <SelectItem value="RECONCILIATION_REVERSAL">Reconciliation Reversal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page Size Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Items Per Page
              </label>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Ledger Entries Table */}
        {!selectedLeaveTypeId ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Leave Type Selected</h3>
              <p className="text-sm text-muted-foreground">
                Select a leave type from the dropdown above to view the detailed transaction history
              </p>
            </div>
          </div>
        ) : ledgerLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Failed to Load</h3>
              <p className="text-sm text-muted-foreground">
                Unable to load ledger history. Please try again later.
              </p>
            </div>
          </div>
        ) : !balances || balances.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-sm text-muted-foreground">
                There are no ledger entries for this leave type in {leaveYear}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="min-w-[110px] font-semibold">Date</TableHead>
                    <TableHead className="min-w-[160px] font-semibold">Transaction</TableHead>
                    <TableHead className="min-w-[100px] text-right font-semibold">Days</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[110px] font-semibold">
                      Effective Date
                    </TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[220px] font-semibold">
                      Description
                    </TableHead>
                    <TableHead className="hidden xl:table-cell min-w-[140px] font-semibold">
                      Reference
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((ledgerEntry: LedgerEntry, index) => (
                    <TableRow 
                      key={ledgerEntry.id}
                      className={`transition-colors hover:bg-muted/50 ${
                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDateInDhaka(ledgerEntry.transactionDate, "short")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(ledgerEntry.transactionType)}
                          {getTransactionBadge(ledgerEntry.transactionType)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {ledgerEntry.days > 0 && (
                            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                          )}
                          {ledgerEntry.days < 0 && (
                            <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                          )}
                          <span
                            className={`font-bold text-base ${
                              ledgerEntry.days > 0
                                ? "text-green-600"
                                : ledgerEntry.days < 0
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            {formatDays(ledgerEntry.days)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDateInDhaka(ledgerEntry.effectiveDate, "short")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        <div className="max-w-[220px] truncate" title={ledgerEntry.description || "—"}>
                          {ledgerEntry.description || <span className="text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {ledgerEntry.referenceType && ledgerEntry.referenceId ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs font-mono">
                              {ledgerEntry.referenceType}
                            </Badge>
                            <div className="font-mono text-xs text-muted-foreground">
                              {ledgerEntry.referenceId.substring(0, 12)}...
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {selectedLeaveTypeId && pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {ledgerEntries.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(page * pageSize, pagination.totalCount)} of {pagination.totalCount} entries
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={!pagination.hasPrevious}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 px-3">
                <span className="text-sm font-medium">
                  Page {page} of {pagination.totalPages}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pagination.totalPages)}
                disabled={!pagination.hasNext}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Summary Info */}
        {selectedLeaveTypeId && ledgerEntries && ledgerEntries.length > 0 && (
          <div className="p-4  from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Total Entries</p>
                <p className="text-2xl font-bold">{pagination?.totalCount || ledgerEntries.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Credits</p>
                <p className="text-2xl font-bold text-green-600">
                  +
                  {Number(
                    ledgerEntries
                      .filter((e) => parseFloat(e.days.toString()) > 0)
                      .reduce((sum, e) => sum + parseFloat(e.days.toString()), 0)
                  ).toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Debits</p>
                <p className="text-2xl font-bold text-red-600">
                  {Number(
                    ledgerEntries
                      .filter((e) => parseFloat(e.days.toString()) < 0)
                      .reduce((sum, e) => sum + parseFloat(e.days.toString()), 0)
                  ).toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Net Balance</p>
                <p className="text-2xl font-bold text-primary">
                  {Number(ledgerEntries.reduce((sum, e) => sum + parseFloat(e.days.toString()), 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
