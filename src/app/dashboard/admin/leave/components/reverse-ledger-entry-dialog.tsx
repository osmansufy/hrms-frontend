"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useReverseLedgerEntry } from "@/lib/queries/leave";
import { formatDateInDhaka } from "@/lib/utils";
import type { LedgerEntry } from "@/lib/api/leave";

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  OPENING: "Opening Balance",
  ACCRUAL: "Accrual",
  LEAVE_APPROVED: "Leave Approved",
  LEAVE_DEDUCTION: "Leave Deduction",
  LEAVE_CANCELLED: "Leave Cancelled",
  CARRY_FORWARD: "Carry Forward",
  LAPSE: "Lapse",
  ENCASHMENT: "Encashment",
  ADJUSTMENT: "Adjustment",
  AMENDMENT_DEBIT: "Amendment Debit",
  AMENDMENT_CREDIT: "Amendment Credit",
};

const MIN_REASON_LENGTH = 10;

type Props = {
  entry: LedgerEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReverseLedgerEntryDialog({ entry, open, onOpenChange }: Props) {
  const [reason, setReason] = useState("");
  const reverseMutation = useReverseLedgerEntry();

  const handleClose = () => {
    setReason("");
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!entry) return;

    if (reason.trim().length < MIN_REASON_LENGTH) {
      toast.error(`Reason must be at least ${MIN_REASON_LENGTH} characters`);
      return;
    }

    try {
      await reverseMutation.mutateAsync({
        ledgerEntryId: entry.id,
        reason: reason.trim(),
      });
      toast.success("Ledger entry reversed successfully");
      handleClose();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to reverse ledger entry";
      toast.error(msg);
    }
  };

  if (!entry) return null;

  const isDebit = entry.days < 0;
  const reversalDays = -entry.days;
  const reasonTooShort = reason.trim().length < MIN_REASON_LENGTH && reason.trim().length > 0;
  const canSubmit =
    reason.trim().length >= MIN_REASON_LENGTH && !reverseMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-500" />
            Reverse Ledger Entry
          </DialogTitle>
          <DialogDescription>
            Creates an{" "}
            <span className="font-mono text-xs font-semibold">
              ADMIN_CORRECTION_REVERSAL
            </span>{" "}
            entry that cancels this transaction. This action is irreversible.
          </DialogDescription>
        </DialogHeader>

        {/* Entry summary */}
        <div className="rounded-lg border bg-muted/40 p-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Transaction</span>
            <Badge variant={isDebit ? "destructive" : "secondary"}>
              {TRANSACTION_TYPE_LABELS[entry.transactionType] ??
                entry.transactionType}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Employee</span>
            <span className="font-medium">
              {entry.user?.employee
                ? `${entry.user.employee.firstName} ${entry.user.employee.lastName}`
                : entry.user?.name || entry.user?.email}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Leave Type</span>
            <div className="flex items-center gap-1.5">
              <span>{entry.leaveType?.name}</span>
              {entry.leaveType?.code && (
                <Badge variant="outline" className="text-xs">
                  {entry.leaveType.code}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Original Days</span>
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
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Reversal Will Add</span>
            <span
              className={
                reversalDays > 0
                  ? "text-green-600 font-semibold"
                  : "text-red-600 font-semibold"
              }
            >
              {reversalDays > 0 ? "+" : ""}
              {reversalDays} days
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Effective Date</span>
            <span>{formatDateInDhaka(entry.effectiveDate, "long")}</span>
          </div>
          {entry.description && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Description</span>
              <span className="text-xs bg-background rounded p-2 border font-mono break-all">
                {entry.description}
              </span>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="flex gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            This reversal cannot itself be reversed. Ensure the original entry
            is genuinely incorrect before proceeding.
          </span>
        </div>

        {/* Reason input */}
        <div className="space-y-1.5">
          <Label htmlFor="reversal-reason">
            Reason{" "}
            <span className="text-muted-foreground text-xs">
              (min {MIN_REASON_LENGTH} characters)
            </span>
          </Label>
          <Textarea
            id="reversal-reason"
            placeholder="Describe why this entry needs to be reversed..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className={reasonTooShort ? "border-red-400 focus-visible:ring-red-400" : ""}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={reasonTooShort ? "text-red-500" : ""}>
              {reasonTooShort
                ? `${MIN_REASON_LENGTH - reason.trim().length} more characters needed`
                : ""}
            </span>
            <span>{reason.trim().length} chars</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={reverseMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canSubmit}
          >
            {reverseMutation.isPending ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Reversing...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Confirm Reversal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
