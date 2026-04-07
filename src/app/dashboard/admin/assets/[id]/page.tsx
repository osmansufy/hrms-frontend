"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Laptop, UserCheck, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAsset, useAssignments } from "@/lib/queries/asset";
import type { Asset, AssetStatus, AssetCondition } from "@/lib/api/asset";
import { ASSET_STATUS } from "@/lib/api/asset";
import { formatDateInDhaka } from "@/lib/utils";
import { AssignAssetDialog } from "../components/assign-asset-dialog";
import { ReturnAssetDialog } from "../components/return-asset-dialog";
import { useState } from "react";
import { TableSkeleton } from "@/components/ui/table-skeleton";

const statusVariant: Record<
  AssetStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  AVAILABLE: "default",
  ASSIGNED: "secondary",
  UNDER_MAINTENANCE: "outline",
  RETIRED: "destructive",
};

function statusLabel(s: AssetStatus) {
  return s.replace(/_/g, " ");
}

const conditionVariant: Record<
  AssetCondition,
  "default" | "secondary" | "destructive" | "outline"
> = {
  NEW: "default",
  GOOD: "default",
  FAIR: "secondary",
  POOR: "outline",
  DAMAGED: "destructive",
};

function conditionLabel(c: AssetCondition) {
  return c;
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params?.id && typeof params.id === "string" ? params.id : "";
  const [assignOpen, setAssignOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const { data: asset, isLoading: assetLoading } = useAsset(assetId);
  const { data: assignmentsData, isLoading: historyLoading } = useAssignments({
    assetId: assetId || undefined,
    pageSize: 100,
  });

  const assignments = assignmentsData?.data ?? [];

  if (!assetId) {
    return (
      <div className="container space-y-6">
        <p className="text-muted-foreground">Invalid asset ID.</p>
        <Link href="/dashboard/admin/assets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Back to Assets
          </Button>
        </Link>
      </div>
    );
  }

  if (assetLoading || !asset) {
    return (
      <div className="container space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-1 h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="space-y-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Asset
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {asset.assetTag}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {asset.assetType?.name ?? "Asset"} · {statusLabel(asset.status)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {asset.status === "AVAILABLE" && (
            <Button size="sm" onClick={() => setAssignOpen(true)}>
              Assign
            </Button>
          )}
          {asset.status === "ASSIGNED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReturnOpen(true)}
            >
              Return
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Laptop className="size-4" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                <dd className="flex items-center gap-2">
                  {asset.condition}{" "}
                  <Badge variant={statusVariant[asset.status]}>
                    {statusLabel(asset.status)}
                  </Badge>
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
                  <dd>
                    {formatDateInDhaka(asset.purchaseDate, "long")}
                  </dd>
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
                  <dt className="text-muted-foreground">Currently assigned to</dt>
                  <dd>
                    {asset.assignments[0].employee
                      ? `${asset.assignments[0].employee.firstName} ${asset.assignments[0].employee.lastName} (${asset.assignments[0].employee.employeeCode})`
                      : "—"}{" "}
                    since{" "}
                    {formatDateInDhaka(
                      asset.assignments[0].assignedAt,
                      "long"
                    )}
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
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="size-4" />
              Assignment history
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Past and current assignments for this asset
            </p>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <TableSkeleton columns={4} rows={5} />
            ) : assignments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No assignment history yet.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Returned</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Condition</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          {a.employee
                            ? `${a.employee.firstName} ${a.employee.lastName} (${a.employee.employeeCode})`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDateInDhaka(a.assignedAt, "short")}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {a.returnedAt
                            ? formatDateInDhaka(a.returnedAt, "short")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {a.isActive ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="outline">Returned</Badge>
                            )}
                        </TableCell>
                        <TableCell>
                          {a.conditionAtAssignment && (
                            <Badge variant={conditionVariant[a.conditionAtAssignment]}>
                              {conditionLabel(a.conditionAtAssignment)}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {assignOpen && (
        <AssignAssetDialog
          asset={asset}
          open={assignOpen}
          onOpenChange={(open) => {
            setAssignOpen(open);
            if (!open) router.refresh();
          }}
        />
      )}
      {returnOpen && (
        <ReturnAssetDialog
          asset={asset}
          open={returnOpen}
          onOpenChange={(open) => {
            setReturnOpen(open);
            if (!open) router.refresh();
          }}
        />
      )}
    </div>
  );
}
