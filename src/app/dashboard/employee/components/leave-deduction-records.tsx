"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMyLedgerHistory } from "@/lib/queries/leave";
import { useUserBalances } from "@/lib/queries/leave";
import { formatDateInDhaka } from "@/lib/utils";
import { Calendar, Minus, Plus, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaveDeductionRecordsProps {
  leaveTypeId?: string;
}

export function LeaveDeductionRecords({ leaveTypeId }: LeaveDeductionRecordsProps) {
  const { data: balances, isLoading: balancesLoading } = useUserBalances();

  // If no leaveTypeId provided, use the first available leave type
  const targetLeaveTypeId = leaveTypeId || balances?.[0]?.leaveTypeId;

  const { data: ledgerData, isLoading: ledgerLoading } = useMyLedgerHistory(
    targetLeaveTypeId || ""
  );

  // Filter only deduction entries (negative days)
  const deductionEntries = useMemo(() => {
    if (!ledgerData) return [];

    return ledgerData
      .filter(entry => entry.days < 0)
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())
      .slice(0, 10); // Show last 10 deductions
  }, [ledgerData]);

  const getTransactionTypeIcon = (transactionType: string) => {
    switch (transactionType) {
      case "LEAVE_APPROVED":
        return <Minus className="h-4 w-4 text-red-500" />;
      case "LAPSE":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "ENCASHMENT":
        return <Minus className="h-4 w-4 text-blue-500" />;
      case "ADJUSTMENT":
        return <Minus className="h-4 w-4 text-purple-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionTypeLabel = (transactionType: string) => {
    switch (transactionType) {
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
        {deductionEntries.length === 0 ? (
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
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Days Deducted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deductionEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {getTransactionTypeIcon(entry.transactionType)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateInDhaka(entry.effectiveDate, "short")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getTransactionTypeLabel(entry.transactionType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {entry.description || "No description"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-red-600">
                        {Math.abs(entry.days)} day{Math.abs(entry.days) !== 1 ? 's' : ''}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {deductionEntries.length >= 10 && (
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing last 10 deductions. View full history in leave management.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}