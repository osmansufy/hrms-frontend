"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReturnAsset } from "@/lib/queries/asset";
import type { Asset } from "@/lib/api/asset";
import { toast } from "sonner";

type ReturnAssetDialogProps = {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReturnAssetDialog({
  asset,
  open,
  onOpenChange,
}: ReturnAssetDialogProps) {
  const [notes, setNotes] = useState("");
  const returnMutation = useReturnAsset(asset.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await returnMutation.mutateAsync({ notes: notes.trim() || undefined });
      toast.success("Asset returned");
      setNotes("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to return asset");
    }
  };

  const assignee = asset.assignments?.[0]?.employee
    ? `${asset.assignments[0].employee.firstName} ${asset.assignments[0].employee.lastName}`
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Return Asset</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Mark <strong>{asset.assetTag}</strong> as returned (currently
            assigned to {assignee})
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional return notes"
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
            <Button
              type="submit"
              variant="default"
              disabled={returnMutation.isPending}
            >
              {returnMutation.isPending ? "Returning…" : "Confirm return"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
