"use client";

import { useState } from "react";
import { Package, Plus, Search, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAssets, useAssetTypes } from "@/lib/queries/asset";
import type { Asset, AssetStatus } from "@/lib/api/asset";
import { ASSET_STATUS } from "@/lib/api/asset";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { toast } from "sonner";
import { CreateAssetDialog } from "./components/create-asset-dialog";
import Link from "next/link";
import { AssetDetailDialog } from "./components/asset-detail-dialog";
import { ReturnAssetDialog } from "./components/return-asset-dialog";
import { AssignAssetDialog } from "./components/assign-asset-dialog";

const statusVariant: Record<AssetStatus, "default" | "secondary" | "destructive" | "outline"> = {
  AVAILABLE: "default",
  ASSIGNED: "secondary",
  UNDER_MAINTENANCE: "outline",
  RETIRED: "destructive",
};

function statusLabel(s: AssetStatus) {
  return s.replace(/_/g, " ");
}

export default function AdminAssetsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AssetStatus | "">("");
  const [assetTypeId, setAssetTypeId] = useState<string>("__all__");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [assetToAssign, setAssetToAssign] = useState<Asset | null>(null);
  const [assetToReturn, setAssetToReturn] = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);

  const { data, isLoading } = useAssets({
    page,
    pageSize: 20,
    status: status || undefined,
    assetTypeId: assetTypeId && assetTypeId !== "__all__" ? assetTypeId : undefined,
    search: search.trim() || undefined,
  });
  const { data: typesData } = useAssetTypes(false);
  const types = typesData ?? [];

  const assets = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="container space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Asset Management
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage company assets, assignments, and inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/admin/assets/types">
            <Button variant="outline" size="sm">
              Asset Types
            </Button>
          </Link>
          <Link href="/dashboard/admin/assets/requests">
            <Button variant="outline" size="sm">
              Requests
            </Button>
          </Link>
          <Link href="/dashboard/admin/assets/offboarding">
            <Button variant="outline" size="sm">
              Offboarding
            </Button>
          </Link>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Asset
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Laptop className="size-4" />
            Assets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by tag or serial..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as AssetStatus | "")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={assetTypeId}
              onValueChange={setAssetTypeId}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Asset type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All types</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton columns={7} rows={8} />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tag</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Serial / Model</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned to</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No assets found. Add one to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      assets.map((asset) => {
                        const assigned = asset.assignments?.[0];
                        const assignee = assigned?.employee
                          ? `${assigned.employee.firstName} ${assigned.employee.lastName}`
                          : null;
                        return (
                          <TableRow key={asset.id}>
                            <TableCell>
                              <button
                                type="button"
                                className="font-medium text-primary hover:underline"
                                onClick={() => setDetailAsset(asset)}
                              >
                                {asset.assetTag}
                              </button>
                            </TableCell>
                            <TableCell>
                              {asset.assetType?.name ?? "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {asset.serialNumber || asset.model || "—"}
                            </TableCell>
                            <TableCell>{asset.condition}</TableCell>
                            <TableCell>
                              <Badge variant={statusVariant[asset.status]}>
                                {statusLabel(asset.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>{assignee ?? "—"}</TableCell>
                            <TableCell className="text-right">
                              {asset.status === "AVAILABLE" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mr-1"
                                  onClick={() => setAssetToAssign(asset)}
                                >
                                  Assign
                                </Button>
                              )}
                              {asset.status === "ASSIGNED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAssetToReturn(asset)}
                                >
                                  Return
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CreateAssetDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        assetTypes={types}
      />
      {assetToAssign && (
        <AssignAssetDialog
          asset={assetToAssign}
          open={!!assetToAssign}
          onOpenChange={(open: boolean) => !open && setAssetToAssign(null)}
        />
      )}
      {assetToReturn && (
        <ReturnAssetDialog
          asset={assetToReturn}
          open={!!assetToReturn}
          onOpenChange={(open: boolean) => !open && setAssetToReturn(null)}
        />
      )}
      {detailAsset && (
        <AssetDetailDialog
          assetId={detailAsset.id}
          open={!!detailAsset}
          onOpenChange={(open: boolean) => !open && setDetailAsset(null)}
        />
      )}
    </div>
  );
}
