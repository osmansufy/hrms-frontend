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
import { useAssignAsset } from "@/lib/queries/asset";
import { useEmployees } from "@/lib/queries/employees";
import type { Asset } from "@/lib/api/asset";
import type { AssetCondition } from "@/lib/api/asset";
import { ASSET_CONDITION } from "@/lib/api/asset";
import { toast } from "sonner";

type AssignAssetDialogProps = {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AssignAssetDialog({
  asset,
  open,
  onOpenChange,
}: AssignAssetDialogProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [conditionAtAssignment, setConditionAtAssignment] =
    useState<AssetCondition>("GOOD");
  const [notes, setNotes] = useState("");

  const assign = useAssignAsset(asset.id);
  const { data: employees } = useEmployees({});

  const employeeList = employees ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error("Please select an employee");
      return;
    }
    try {
      await assign.mutateAsync({
        employeeId,
        conditionAtAssignment,
        notes: notes.trim() || undefined,
      });
      toast.success("Asset assigned");
      setEmployeeId("");
      setNotes("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to assign asset");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Asset</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Assign <strong>{asset.assetTag}</strong> to an employee
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Employee *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employeeList.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                    {emp.employeeCode ? ` (${emp.employeeCode})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Condition at assignment</Label>
            <Select
              value={conditionAtAssignment}
              onValueChange={(v) => setConditionAtAssignment(v as AssetCondition)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_CONDITION.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
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
            <Button type="submit" disabled={assign.isPending}>
              {assign.isPending ? "Assigning…" : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
