"use client";

import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LateAttendanceConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  lateCount: number;
}

export function LateAttendanceConfirmationModal({
  open,
  onClose,
  lateCount,
}: LateAttendanceConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-xl font-bold">
              Leave Deducted for Late Attendance
            </DialogTitle>
          </div>
        </DialogHeader>

        <DialogDescription className="text-base text-foreground pt-2 pb-4">
          You have been late <strong>{lateCount} times</strong> this month. As
          per policy, <strong>1 day of casual leave</strong> has been deducted
          from your leave balance.
        </DialogDescription>

        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> For every late attendance beyond 3
            occurrences in a month, one day of casual leave will be
            automatically deducted.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">
            Understood
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
