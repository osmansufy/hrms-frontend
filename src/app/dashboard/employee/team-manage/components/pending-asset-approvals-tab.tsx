"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  useManagerPendingAssetRequests, 
  useApproveAssetRequest, 
  useRejectAssetRequest 
} from "@/lib/queries/asset";
import { Package, Check, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDateInDhaka } from "@/lib/utils";
import type { AssetRequest } from "@/lib/api/asset";

function formatDate(dateString: string) {
  return formatDateInDhaka(dateString, "long");
}

export function PendingAssetApprovalsTab() {
  const { data: pendingRequests, isLoading } = useManagerPendingAssetRequests();
  const approveMutation = useApproveAssetRequest();
  const rejectMutation = useRejectAssetRequest();
  
  const [selectedRequest, setSelectedRequest] = useState<{
    id: string;
    action: "approve" | "reject";
    employeeName: string;
    assetType: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async (request: AssetRequest) => {
    const employeeName = request.employee
      ? `${request.employee.firstName} ${request.employee.lastName}`
      : "Employee";
    setSelectedRequest({
      id: request.id,
      action: "approve",
      employeeName,
      assetType: request.assetType?.name ?? "Unknown",
    });
  };

  const handleReject = async (request: AssetRequest) => {
    const employeeName = request.employee
      ? `${request.employee.firstName} ${request.employee.lastName}`
      : "Employee";
    setSelectedRequest({
      id: request.id,
      action: "reject",
      employeeName,
      assetType: request.assetType?.name ?? "Unknown",
    });
    setRejectionReason("");
  };

  const confirmAction = async () => {
    if (!selectedRequest) return;

    try {
      if (selectedRequest.action === "approve") {
        await approveMutation.mutateAsync(selectedRequest.id);
        toast.success("Asset request approved", {
          description: `${selectedRequest.employeeName}'s request for ${selectedRequest.assetType} has been sent to HR/Admin for final approval`,
        });
      } else {
        if (!rejectionReason.trim()) {
          toast.error("Rejection reason is required");
          return;
        }
        await rejectMutation.mutateAsync({
          id: selectedRequest.id,
          rejectionReason: rejectionReason.trim(),
        });
        toast.success("Asset request rejected", {
          description: `${selectedRequest.employeeName}'s request has been rejected`,
        });
      }
      setSelectedRequest(null);
      setRejectionReason("");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        `Failed to ${selectedRequest.action} asset request`;
      toast.error(`${selectedRequest.action === "approve" ? "Approval" : "Rejection"} Failed`, {
        description: errorMessage,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Pending Asset Requests
          </CardTitle>
          <CardDescription>
            Review and approve asset requests from your team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const requests = pendingRequests || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Pending Asset Requests
            {requests.length > 0 && (
              <Badge variant="default" className="ml-2">
                {requests.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Review and approve asset requests from your team members. After your approval,
            requests will be sent to HR/Admin for final processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Package className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No pending asset requests from your team
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Asset Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => {
                    const employeeName = request.employee
                      ? `${request.employee.firstName} ${request.employee.lastName}`
                      : "—";
                    const employeeCode = request.employee?.employeeCode ?? "";

                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employeeName}</div>
                            {employeeCode && (
                              <div className="text-xs text-muted-foreground">
                                {employeeCode}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {request.assetType?.name ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="text-sm text-muted-foreground truncate">
                            {request.reason || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {request.requestedAt
                            ? formatDate(request.requestedAt)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(request)}
                            disabled={
                              approveMutation.isPending ||
                              rejectMutation.isPending
                            }
                          >
                            <Check className="size-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request)}
                            disabled={
                              approveMutation.isPending ||
                              rejectMutation.isPending
                            }
                          >
                            <X className="size-4 mr-1" />
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => {
          setSelectedRequest(null);
          setRejectionReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.action === "approve"
                ? "Approve Asset Request"
                : "Reject Asset Request"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.action === "approve" ? (
                <>
                  You are approving{" "}
                  <strong>{selectedRequest?.employeeName}</strong>&apos;s request
                  for <strong>{selectedRequest?.assetType}</strong>.
                  <br />
                  <br />
                  After your approval, this request will be forwarded to HR/Admin
                  for final approval and asset assignment.
                </>
              ) : (
                <>
                  You are rejecting{" "}
                  <strong>{selectedRequest?.employeeName}</strong>&apos;s request
                  for <strong>{selectedRequest?.assetType}</strong>.
                  <br />
                  <br />
                  Please provide a reason for rejection. The employee will see
                  this message.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest?.action === "reject" && (
            <div className="py-4">
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setRejectionReason("");
              }}
              disabled={
                approveMutation.isPending || rejectMutation.isPending
              }
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={
                approveMutation.isPending || rejectMutation.isPending
              }
              variant={
                selectedRequest?.action === "approve" ? "default" : "destructive"
              }
            >
              {(approveMutation.isPending || rejectMutation.isPending) && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              {selectedRequest?.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
