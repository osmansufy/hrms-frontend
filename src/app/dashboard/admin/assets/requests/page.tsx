"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  useAssetRequests,
  useApproveAssetRequest,
  useRejectAssetRequest,
} from "@/lib/queries/asset";
import type { AssetRequest, AssetRequestStatus } from "@/lib/api/asset";
import { ASSET_REQUEST_STATUS } from "@/lib/api/asset";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { toast } from "sonner";
import { formatDateInDhaka } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FulfillRequestDialog } from "./components/fulfill-request-dialog";
import Link from "next/link";

const statusVariant: Record<
  AssetRequestStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  PROCESSING: "default",
  APPROVED: "default",
  REJECTED: "destructive",
  FULFILLED: "secondary",
};

function statusLabel(s: AssetRequestStatus) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export default function AdminAssetRequestsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AssetRequestStatus | "">("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [fulfillRequest, setFulfillRequest] = useState<AssetRequest | null>(null);

  const { data, isLoading } = useAssetRequests({
    page,
    pageSize: 20,
    status: status || undefined,
  });
  const approve = useApproveAssetRequest();
  const reject = useRejectAssetRequest();

  const requests = data?.data ?? [];
  const pagination = data?.pagination;

  const handleApprove = async (id: string) => {
    try {
      await approve.mutateAsync(id);
      toast.success("Request approved");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to approve");
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    try {
      await reject.mutateAsync({ id: rejectId, rejectionReason: rejectReason.trim() });
      toast.success("Request rejected");
      setRejectId(null);
      setRejectReason("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to reject");
    }
  };

  return (
    <div className="container space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Inventory
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Asset Requests
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Approve, reject, or fulfill employee asset requests
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/admin/assets">
            <Button variant="outline" size="sm">
              Assets
            </Button>
          </Link>
          <Link href="/dashboard/admin/assets/types">
            <Button variant="outline" size="sm">
              Asset Types
            </Button>
          </Link>
        </div>
      </div>

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
              value={status}
              onValueChange={(v) => setStatus(v as AssetRequestStatus | "")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_REQUEST_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton columns={6} rows={8} />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Asset type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No requests found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((req) => {
                        const emp = req.employee
                          ? `${req.employee.firstName} ${req.employee.lastName}`
                          : "—";
                        return (
                          <TableRow key={req.id}>
                            <TableCell>{emp}</TableCell>
                            <TableCell>{req.assetType?.name ?? "—"}</TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate">
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
                            <TableCell className="text-right">
                              {req.status === "PROCESSING" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mr-1"
                                    onClick={() => handleApprove(req.id)}
                                    disabled={approve.isPending}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mr-1"
                                    onClick={() => setRejectId(req.id)}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {req.status === "APPROVED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setFulfillRequest(req)}
                                >
                                  Fulfill
                                </Button>
                              )}
                              {req.status === "PENDING" && (
                                <span className="text-sm text-muted-foreground">
                                  Awaiting line manager
                                </span>
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
                    Page {pagination.page} of {pagination.totalPages} (
                    {pagination.totalCount} total)
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

      <AlertDialog open={!!rejectId} onOpenChange={() => { setRejectId(null); setRejectReason(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject request</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejection. The employee will see this message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rejection reason..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleReject();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {fulfillRequest && (
        <FulfillRequestDialog
          request={fulfillRequest}
          open={!!fulfillRequest}
          onOpenChange={(open) => !open && setFulfillRequest(null)}
        />
      )}
    </div>
  );
}
