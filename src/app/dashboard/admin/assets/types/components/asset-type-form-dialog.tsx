"use client";

import { useState, useEffect } from "react";
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
import { useCreateAssetType, useUpdateAssetType } from "@/lib/queries/asset";
import type { AssetType } from "@/lib/api/asset";
import { toast } from "sonner";

type AssetTypeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: AssetType | null;
};

export function AssetTypeFormDialog({
  open,
  onOpenChange,
  editing,
}: AssetTypeFormDialogProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const create = useCreateAssetType();
  const update = useUpdateAssetType(editing?.id ?? "");

  useEffect(() => {
    if (editing) {
      setCode(editing.code);
      setName(editing.name);
      setDescription(editing.description ?? "");
    } else {
      setCode("");
      setName("");
      setDescription("");
    }
  }, [editing, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!editing && !code.trim()) {
      toast.error("Code is required");
      return;
    }
    try {
      if (editing) {
        await update.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast.success("Asset type updated");
      } else {
        await create.mutateAsync({
          code: code.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          isActive: true,
        });
        toast.success("Asset type created");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to save");
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit asset type" : "Add asset type"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. LAPTOP"
              disabled={!!editing}
            />
            {editing && (
              <p className="text-xs text-muted-foreground">Code cannot be changed</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laptop"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
