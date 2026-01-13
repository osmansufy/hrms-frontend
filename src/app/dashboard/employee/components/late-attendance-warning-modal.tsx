"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface LateAttendanceWarningModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lateCount: number;
}

export function LateAttendanceWarningModal({
  open,
  onClose,
  onConfirm,
  lateCount,
}: LateAttendanceWarningModalProps) {
  const [confirmation1Checked, setConfirmation1Checked] = useState(false);
  const [confirmation2Text, setConfirmation2Text] = useState("");

  const canProceed =
    confirmation1Checked && confirmation2Text.toUpperCase() === "CONFIRM";

  const handleConfirm = () => {
    if (canProceed) {
      onConfirm();
      // Reset state
      setConfirmation1Checked(false);
      setConfirmation2Text("");
    }
  };

  const handleClose = () => {
    setConfirmation1Checked(false);
    setConfirmation2Text("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-xl font-bold">
              Late Attendance Warning
            </DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <DialogDescription className="text-base text-foreground pt-2 pb-4">
          You have already been late <strong>{lateCount} times</strong> this
          month. One additional late will result in a{" "}
          <strong>leave adjustment</strong>.
        </DialogDescription>

        <Separator className="my-4" />

        <div className="space-y-6">
          {/* Confirmation 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold">Confirmation 1</Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirmation1"
                checked={confirmation1Checked}
                onCheckedChange={(checked) =>
                  setConfirmation1Checked(checked === true)
                }
                className="mt-0.5"
              />
              <Label
                htmlFor="confirmation1"
                className="text-sm leading-relaxed cursor-pointer"
              >
                <p>
                  I understand that I have already been late{" "}
                  <strong>{lateCount} times</strong> this month, and that one
                  more late will result in a leave adjustment.
                </p>
              </Label>
            </div>
          </div>

          {/* Confirmation 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold">Confirmation 2</Label>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                type CONFIRM
              </span>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                This is my final confirmation to proceed with sign out.
              </Label>
              <Input
                placeholder="TYPE CONFIRM"
                value={confirmation2Text}
                onChange={(e) => setConfirmation2Text(e.target.value)}
                className="uppercase font-mono"
              />
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">
              Late count: <strong>{lateCount}</strong> /month
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canProceed}
              className={cn(
                "text-white",
                canProceed
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-600/50 cursor-not-allowed"
              )}
            >
              Acknowledge & Sign In
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
