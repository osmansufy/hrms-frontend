"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useMyLedgerHistory } from "@/lib/queries/leave";
import { useUserBalances } from "@/lib/queries/leave";
import { formatDateInDhaka } from "@/lib/utils";
import { Calendar, Minus, Plus, AlertCircle, Loader2, RotateCcw, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LedgerEntry } from "@/lib/api/leave";

const CREDIT_TYPES = new Set([
    "RECONCILIATION_REVERSAL",
    "ADMIN_CORRECTION_REVERSAL",
]);

const DEFAULT_TRANSACTION_TYPES = "LEAVE_DEDUCTION,RECONCILIATION_REVERSAL,ADMIN_CORRECTION_REVERSAL";
const PAGE_SIZE = 10;

interface LeaveDeductionRecordsProps {
    leaveTypeId?: string;
}

export function LeaveDeductionRecords({ leaveTypeId }: LeaveDeductionRecordsProps) {
    const [page, setPage] = useState(1);
    const { data: balances, isLoading: balancesLoading } = useUserBalances();

    const targetLeaveTypeId = leaveTypeId || balances?.[0]?.leaveTypeId;

    const { data: ledgerData, isLoading: ledgerLoading } = useMyLedgerHistory(
        targetLeaveTypeId || "",
        {
            transactionType: DEFAULT_TRANSACTION_TYPES,
            page,
            pageSize: PAGE_SIZE,
        }
    );

    const entries: LedgerEntry[] = ledgerData?.data ?? [];
    const pagination = ledgerData?.pagination;

    const getTransactionTypeIcon = (transactionType: string) => {
        switch (transactionType) {
            case "LEAVE_DEDUCTION":
                return <Minus className="h-4 w-4 text-red-500" />;
            case "LEAVE_APPROVED":
                return <Minus className="h-4 w-4 text-red-500" />;
            case "LAPSE":
                return <AlertCircle className="h-4 w-4 text-orange-500" />;
            case "ENCASHMENT":
                return <Minus className="h-4 w-4 text-blue-500" />;
            case "ADJUSTMENT":
                return <Minus className="h-4 w-4 text-purple-500" />;
            case "RECONCILIATION_REVERSAL":
                return <Plus className="h-4 w-4 text-green-500" />;
            case "ADMIN_CORRECTION_REVERSAL":
                return <RotateCcw className="h-4 w-4 text-orange-500" />;
            default:
                return <Minus className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTransactionTypeLabel = (transactionType: string) => {
        switch (transactionType) {
            case "LEAVE_DEDUCTION":
                return "Late Attendance Deduction";
            case "LEAVE_APPROVED":
                return "Leave Taken";
            case "LAPSE":
                return "Expired";
            case "ENCASHMENT":
                return "Encashed";
            case "ADJUSTMENT":
                return "Adjustment";
            case "AMENDMENT_DEBIT":
                return "Amendment";
            case "RECONCILIATION_REVERSAL":
                return "Reconciliation Reversal";
            case "ADMIN_CORRECTION_REVERSAL":
                return "Admin Correction";
            default:
                return transactionType.replace("_", " ").toLowerCase();
        }
    };

    if (balancesLoading || ledgerLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Leave Deduction Records</CardTitle>
                    <CardDescription>Recent leave deductions from your balance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Loading deduction records...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!targetLeaveTypeId || !balances?.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Leave Deduction Records</CardTitle>
                    <CardDescription>Recent leave deductions from your balance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No leave types available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const selectedBalance = balances.find(b => b.leaveTypeId === targetLeaveTypeId);
    const leaveTypeName = selectedBalance?.leaveTypeName || "Leave";

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Minus className="h-5 w-5 text-red-500" />
                    {leaveTypeName} Deduction Records
                </CardTitle>
                <CardDescription>
                    Recent deductions from your {leaveTypeName.toLowerCase()} balance
                </CardDescription>
            </CardHeader>
            <CardContent>
                {entries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No deduction records found</p>
                        <p className="text-sm mt-1">Your leave deductions will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-8"></TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Days Impact</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entries.map((entry: LedgerEntry) => {
                                    const isCredit = CREDIT_TYPES.has(entry.transactionType);
                                    const isAdminCorrection = entry.transactionType === "ADMIN_CORRECTION_REVERSAL";
                                    const meta = entry.metadata as Record<string, any> | null;
                                    return (
                                        <TableRow key={entry.id}>
                                            <TableCell>
                                                {getTransactionTypeIcon(entry.transactionType)}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatDateInDhaka(entry.effectiveDate, "short")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-xs",
                                                            isAdminCorrection && "border-orange-400 text-orange-700",
                                                        )}
                                                    >
                                                        {getTransactionTypeLabel(entry.transactionType)}
                                                    </Badge>
                                                    {isAdminCorrection && meta && (
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <button className="text-muted-foreground hover:text-orange-600 transition-colors">
                                                                    <Info className="h-3.5 w-3.5" />
                                                                </button>
                                                            </PopoverTrigger>
                                                            <PopoverContent side="right" align="start" className="w-64 text-sm">
                                                                <div className="space-y-2">
                                                                    <p className="font-semibold text-orange-600 flex items-center gap-1.5">
                                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                                        HR Correction
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        An HR admin corrected a previous entry on your leave record.
                                                                    </p>
                                                                    {meta.originalTransactionType && (
                                                                        <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
                                                                            <span className="text-muted-foreground">Corrected</span>
                                                                            <span className="font-mono font-semibold">
                                                                                {meta.originalTransactionType.replace(/_/g, " ")}
                                                                            </span>
                                                                            {meta.originalDays !== undefined && (
                                                                                <>
                                                                                    <span className="text-muted-foreground">Was</span>
                                                                                    <span className={meta.originalDays > 0 ? "text-green-600" : "text-red-600"}>
                                                                                        {meta.originalDays > 0 ? "+" : ""}{meta.originalDays} days
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                            {meta.originalEffectiveDate && (
                                                                                <>
                                                                                    <span className="text-muted-foreground">Original date</span>
                                                                                    <span>{formatDateInDhaka(meta.originalEffectiveDate, "long")}</span>
                                                                                </>
                                                                            )}
                                                                            {meta.reason && (
                                                                                <>
                                                                                    <span className="text-muted-foreground">Reason</span>
                                                                                    <span className="break-words">{meta.reason}</span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm max-w-xs truncate">
                                                {entry.description || "No description"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={cn(
                                                    "font-medium",
                                                    isCredit ? "text-green-600" : "text-red-600",
                                                )}>
                                                    {isCredit ? "+" : "-"}
                                                    {Math.abs(entry.days)} day{Math.abs(entry.days) !== 1 ? "s" : ""}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} records)
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={!pagination.hasPrevious}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={!pagination.hasNext}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
