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
import { useCreateAsset } from "@/lib/queries/asset";
import type { AssetType, AssetCondition } from "@/lib/api/asset";
import { ASSET_CONDITION } from "@/lib/api/asset";
import { toast } from "sonner";

type CreateAssetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetTypes: AssetType[];
};

export function CreateAssetDialog({
  open,
  onOpenChange,
  assetTypes,
}: CreateAssetDialogProps) {
  const [assetTag, setAssetTag] = useState("");
  const [assetTypeId, setAssetTypeId] = useState<string>("__none__");
  const [serialNumber, setSerialNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [condition, setCondition] = useState<AssetCondition>("GOOD");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const create = useCreateAsset();

  const reset = () => {
    setAssetTag("");
    setAssetTypeId("__none__");
    setSerialNumber("");
    setBrand("");
    setModel("");
    setCondition("GOOD");
    setLocation("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetTag.trim()) {
      toast.error("Asset tag is required");
      return;
    }
    try {
      await create.mutateAsync({
        assetTag: assetTag.trim(),
        assetTypeId: assetTypeId && assetTypeId !== "__none__" ? assetTypeId : undefined,
        serialNumber: serialNumber.trim() || undefined,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        condition,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Asset created");
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to create asset");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assetTag">Asset tag *</Label>
            <Input
              id="assetTag"
              value={assetTag}
              onChange={(e) => setAssetTag(e.target.value)}
              placeholder="e.g. LAP-001"
            />
          </div>
          <div className="space-y-2">
            <Label>Asset type</Label>
            <Select value={assetTypeId} onValueChange={setAssetTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {assetTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Serial number</Label>
              <Input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select
                value={condition}
                onValueChange={(v) => setCondition(v as AssetCondition)}
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Optional"
            />
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
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
