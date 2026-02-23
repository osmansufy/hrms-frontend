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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFulfillAssetRequest, useAssets } from "@/lib/queries/asset";
import type { AssetRequest } from "@/lib/api/asset";
import { toast } from "sonner";

type FulfillRequestDialogProps = {
  request: AssetRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FulfillRequestDialog({
  request,
  open,
  onOpenChange,
}: FulfillRequestDialogProps) {
  const [assetId, setAssetId] = useState("");
  const [notes, setNotes] = useState("");

  const fulfill = useFulfillAssetRequest(request.id);
  const { data: assetsData } = useAssets({
    page: 1,
    pageSize: 100,
    status: "AVAILABLE",
    assetTypeId: request.assetTypeId,
  });

  const availableAssets = (assetsData?.data ?? []).filter(
    (a) => a.status === "AVAILABLE"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) {
      toast.error("Please select an asset");
      return;
    }
    try {
      await fulfill.mutateAsync({
        assetId,
        notes: notes.trim() || undefined,
      });
      toast.success("Request fulfilled; asset assigned to employee");
      setAssetId("");
      setNotes("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to fulfill request");
    }
  };

  const emp = request.employee
    ? `${request.employee.firstName} ${request.employee.lastName}`
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fulfill request</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Assign an available <strong>{request.assetType?.name}</strong> to{" "}
            {emp}.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Available asset *</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {availableAssets.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No available assets of this type
                  </SelectItem>
                ) : (
                  availableAssets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.assetTag}
                      {a.serialNumber ? ` (${a.serialNumber})` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
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
              disabled={fulfill.isPending || availableAssets.length === 0}
            >
              {fulfill.isPending ? "Fulfilling…" : "Fulfill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
