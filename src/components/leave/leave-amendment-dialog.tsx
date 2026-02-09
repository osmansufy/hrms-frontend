"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/auth/session-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAmendment } from "@/lib/queries/leave";
import type { LeaveDetails } from "@/lib/api/leave";

type AmendmentMode = "AMEND" | "CANCEL";

/** Minimal leave shape needed for amendment (detail page or list row) */
export type LeaveAmendmentLeave = {
  id: string;
  startDate: string;
  endDate: string;
  leaveType?: LeaveDetails["leaveType"] | null;
  user?: LeaveDetails["user"];
  status?: string;
};

type LeaveAmendmentDialogProps = {
  leave: LeaveAmendmentLeave;
  mode: AmendmentMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

function toDateInputValue(isoDate: string) {
  const d = new Date(isoDate);
  return d.toISOString().slice(0, 10);
}

export function LeaveAmendmentDialog({
  leave,
  mode,
  open,
  onOpenChange,
  onSuccess,
}: LeaveAmendmentDialogProps) {
  const { session } = useSession();
  const userId = session?.user?.id;
  const createAmendment = useCreateAmendment(userId);

  const [reason, setReason] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  const isAmend = mode === "AMEND";

  useEffect(() => {
    if (open && leave) {
      setReason("");
      setNewStartDate(toDateInputValue(leave.startDate));
      setNewEndDate(toDateInputValue(leave.endDate));
    }
  }, [open, leave?.id, leave?.startDate, leave?.endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) return;

    try {
      await createAmendment.mutateAsync({
        originalLeaveId: leave.id,
        changeType: mode,
        reason: trimmedReason,
        // Send date-only strings (YYYY-MM-DD) to match leave application form and avoid timezone shifts
        ...(isAmend && {
          newStartDate: newStartDate,
          newEndDate: newEndDate,
        }),
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to submit request";
      toast.error("Request failed", { description: message });
    }
  };

  const isValid =
    reason.trim().length >= 5 &&
    (!isAmend || (newStartDate && newEndDate && newEndDate >= newStartDate));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isAmend ? "Amend leave dates" : "Cancel approved leave"}
          </DialogTitle>
          <DialogDescription>
            {isAmend
              ? "Request to change the dates of this approved leave. Your manager and HR will need to approve the change."
              : "Request to cancel this approved leave. Your manager and HR will need to approve. Leave balance will be restored after approval."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isAmend && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newStartDate">New start date</Label>
                <Input
                  id="newStartDate"
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newEndDate">New end date</Label>
                <Input
                  id="newEndDate"
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason {isAmend ? "for change" : "for cancellation"} *
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need to amend or cancel this leave..."
              rows={3}
              required
              minLength={5}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || createAmendment.isPending}>
              {createAmendment.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {isAmend ? "Request amendment" : "Request cancellation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
