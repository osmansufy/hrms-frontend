"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAsset } from "@/lib/queries/asset";
import { formatDateInDhaka } from "@/lib/utils";

type AssetDetailDialogProps = {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AssetDetailDialog({
  assetId,
  open,
  onOpenChange,
}: AssetDetailDialogProps) {
  const { data: asset, isLoading } = useAsset(open ? assetId : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Asset details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ) : asset ? (
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Tag</dt>
              <dd className="font-medium">{asset.assetTag}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd>{asset.assetType?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Serial / Brand / Model</dt>
              <dd>
                {asset.serialNumber || "—"} / {asset.brand || "—"} /{" "}
                {asset.model || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Condition / Status</dt>
              <dd>
                {asset.condition} / {asset.status}
              </dd>
            </div>
            {asset.location && (
              <div>
                <dt className="text-muted-foreground">Location</dt>
                <dd>{asset.location}</dd>
              </div>
            )}
            {asset.purchaseDate && (
              <div>
                <dt className="text-muted-foreground">Purchase date</dt>
                <dd>{formatDateInDhaka(asset.purchaseDate, "long")}</dd>
              </div>
            )}
            {asset.warrantyEnd && (
              <div>
                <dt className="text-muted-foreground">Warranty end</dt>
                <dd>{formatDateInDhaka(asset.warrantyEnd, "long")}</dd>
              </div>
            )}
            {asset.assignments?.[0] && (
              <div>
                <dt className="text-muted-foreground">Assigned to</dt>
                <dd>
                  {asset.assignments[0].employee
                    ? `${asset.assignments[0].employee.firstName} ${asset.assignments[0].employee.lastName} (${asset.assignments[0].employee.employeeCode})`
                    : "—"}{" "}
                  since{" "}
                  {formatDateInDhaka(asset.assignments[0].assignedAt, "long")}
                </dd>
              </div>
            )}
            {asset.notes && (
              <div>
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="text-muted-foreground">{asset.notes}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Asset not found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
