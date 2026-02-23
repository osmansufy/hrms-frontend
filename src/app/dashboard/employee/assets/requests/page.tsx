"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Plus, ArrowLeft } from "lucide-react";
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
import {
  useMyAssetRequests,
  useCreateAssetRequest,
  useAssetTypes,
} from "@/lib/queries/asset";
import { useMyUserMeta } from "@/lib/queries/user-meta";
import type { AssetRequestStatus } from "@/lib/api/asset";
import { ASSET_REQUEST_STATUS } from "@/lib/api/asset";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { toast } from "sonner";
import { formatDateInDhaka } from "@/lib/utils";

const statusVariant: Record<
  AssetRequestStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  FULFILLED: "secondary",
};

function statusLabel(s: AssetRequestStatus) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export default function EmployeeAssetRequestsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [assetTypeId, setAssetTypeId] = useState("");
  const [reason, setReason] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const { data: userMeta } = useMyUserMeta();
  const allowAssetRequest = userMeta?.allowAssetRequest !== false;

  const { data, isLoading } = useMyAssetRequests({
    page,
    pageSize: 10,
    status: statusFilter && statusFilter !== "__all__" ? (statusFilter as AssetRequestStatus) : undefined,
  });
  const { data: typesData } = useAssetTypes(true);
  const create = useCreateAssetRequest();

  const types = typesData ?? [];
  const requests = data?.data ?? [];
  const pagination = data?.pagination;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetTypeId) {
      toast.error("Please select an asset type");
      return;
    }
    try {
      await create.mutateAsync({
        assetTypeId,
        reason: reason.trim() || undefined,
      });
      toast.success("Request submitted");
      setAssetTypeId("");
      setReason("");
      setFormOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to submit request");
    }
  };

  return (
    <div className="container space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/employee/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              My Asset Requests
            </h1>
            <p className="text-sm text-muted-foreground">
              {allowAssetRequest
                ? "View status and submit new requests"
                : "View status of your requests"}
            </p>
          </div>
        </div>
        {allowAssetRequest && (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 size-4" />
            New request
          </Button>
        )}
      </div>

      {!allowAssetRequest && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="py-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              You do not have permission to submit new asset requests. You can still view the status of your existing requests below.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="size-4" />
            Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {ASSET_REQUEST_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton columns={5} rows={5} />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No requests yet. Submit one to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>{req.assetType?.name ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                            {req.reason ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {req.requestedAt
                              ? formatDateInDhaka(req.requestedAt, "short")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[req.status]}>
                              {statusLabel(req.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Page {pagination.page} of {pagination.totalPages}
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

      {allowAssetRequest && formOpen && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Asset type *</Label>
                <Select value={assetTypeId} onValueChange={setAssetTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. New join, replacement"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormOpen(false);
                    setAssetTypeId("");
                    setReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "Submitting…" : "Submit request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
