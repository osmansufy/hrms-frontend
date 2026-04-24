"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";
import { approveAmendment, rejectAmendment } from "@/lib/api/leave";
import { useManagerPendingAmendments, leaveKeys } from "@/lib/queries/leave";
import { formatDateInDhaka } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, FileEdit, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ApiErrorShape = {
  response?: {
    data?: {
      message?: unknown;
    };
  };
  message?: unknown;
};

function getErrorMessage(error: unknown, fallback: string) {
  const e = error as ApiErrorShape;
  return (
    (typeof e?.response?.data?.message === "string" && e.response.data.message) ||
    (typeof e?.message === "string" && e.message) ||
    fallback
  );
}

type LeaveUserShape = {
  name?: string | null;
  email?: string | null;
  employee?: { firstName: string; lastName: string } | null;
};

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return formatDateInDhaka(dateString, "long");
}

export function PendingAmendmentsTab() {
  const queryClient = useQueryClient();
  const { data: amendments, isLoading } = useManagerPendingAmendments();
  const [selected, setSelected] = useState<{
    id: string;
    action: "approve" | "reject";
  } | null>(null);

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveAmendment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.managerPendingAmendments });
      queryClient.invalidateQueries({ queryKey: leaveKeys.managerPending });
      queryClient.invalidateQueries({ queryKey: leaveKeys.managerApproved });
      toast.success("Amendment approved", {
        description: "The amendment is approved at manager step and forwarded for HR final action.",
      });
    },
    onError: (error: unknown) => {
      toast.error("Approval failed", {
        description: getErrorMessage(error, "Failed to approve amendment"),
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectAmendment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.managerPendingAmendments });
      toast.success("Amendment rejected");
    },
    onError: (error: unknown) => {
      toast.error("Rejection failed", {
        description: getErrorMessage(error, "Failed to reject amendment"),
      });
    },
  });

  const anyMutating = approveMutation.isPending || rejectMutation.isPending;

  const pending = useMemo(() => {
    return (amendments ?? []).filter((a) => a.status === "PENDING" || a.status === "PROCESSING");
  }, [amendments]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="text-muted-foreground size-4" />
            Leave Amendments
          </CardTitle>
          <CardDescription>
            Amendment or cancellation requests from your direct reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="text-muted-foreground size-4" />
            Leave Amendments
          </CardTitle>
          <CardDescription>
            Review change or cancellation requests for already-approved leaves.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="text-muted-foreground mb-4 size-12" />
              <h3 className="mb-2 text-lg font-semibold">No pending amendments</h3>
              <p className="text-muted-foreground text-sm">
                Requests from your team will appear here.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Original Dates</TableHead>
                    <TableHead>New Dates</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((a, idx) => {
                    const leaveUser = a.originalLeave?.user as unknown as
                      | LeaveUserShape
                      | undefined;
                    const empName = leaveUser?.employee
                      ? `${leaveUser.employee.firstName} ${leaveUser.employee.lastName}`
                      : (leaveUser?.name ?? leaveUser?.email ?? "Unknown");

                    const canAct = a.status === "PENDING" || a.status === "PROCESSING";
                    const rowBg = idx % 2 !== 0 ? "bg-muted/20" : "";

                    return (
                      <TableRow
                        key={a.id}
                        className={`${rowBg} hover:bg-muted/40 transition-colors`}
                      >
                        <TableCell className="font-medium">{empName}</TableCell>
                        <TableCell>
                          <Badge variant={a.changeType === "CANCEL" ? "destructive" : "default"}>
                            {a.changeType === "CANCEL" ? "Cancel" : "Amend"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {a.originalLeave ? (
                            <div className="text-sm">
                              <div>{formatDate(a.originalLeave.startDate)}</div>
                              <div className="text-muted-foreground">
                                to {formatDate(a.originalLeave.endDate)}
                              </div>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {a.changeType === "AMEND" ? (
                            <div className="text-sm">
                              <div>{formatDate(a.newStartDate)}</div>
                              <div className="text-muted-foreground">
                                to {formatDate(a.newEndDate)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">{a.reason}</TableCell>
                        <TableCell>
                          <LeaveStatusBadge status={a.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {canAct ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                                onClick={() => setSelected({ id: a.id, action: "approve" })}
                                disabled={anyMutating}
                              >
                                <Check className="size-3.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 border-rose-300 text-rose-600 hover:bg-rose-50"
                                onClick={() => setSelected({ id: a.id, action: "reject" })}
                                disabled={anyMutating}
                              >
                                <X className="size-3.5" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
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

      <AlertDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selected?.action === "approve" ? "Approve amendment?" : "Reject amendment?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.action === "approve"
                ? "This approves the amendment at manager step. HR/Admin will finalize and apply balance changes."
                : "This rejects the amendment request. The original leave remains unchanged."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={anyMutating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!selected) return;
                if (selected.action === "approve") approveMutation.mutate(selected.id);
                else rejectMutation.mutate(selected.id);
                setSelected(null);
              }}
              disabled={anyMutating}
              className={selected?.action === "reject" ? "bg-rose-600 hover:bg-rose-700" : ""}
            >
              {anyMutating ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
