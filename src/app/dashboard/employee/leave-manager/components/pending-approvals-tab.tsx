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
import { Checkbox } from "@/components/ui/checkbox";
import { useManagerPendingLeaves, useManagerApproveLeave, useManagerRejectLeave } from "@/lib/queries/leave";
import { AlertCircle, Check, Loader2, X, User, CheckSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkApproveLeaves, bulkRejectLeaves } from "@/lib/api/leave";

// Helper function to format dates
function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

export function PendingApprovalsTab() {
    const queryClient = useQueryClient();
    const { data: pendingLeaves, isLoading } = useManagerPendingLeaves();
    const approveMutation = useManagerApproveLeave();
    const rejectMutation = useManagerRejectLeave();
    const [selectedLeave, setSelectedLeave] = useState<{ id: string; action: "approve" | "reject"; employeeName: string } | null>(null);
    const [selectedLeaveIds, setSelectedLeaveIds] = useState<string[]>([]);
    const [showBulkConfirm, setShowBulkConfirm] = useState<{ action: "approve" | "reject" } | null>(null);

    const bulkApproveMutation = useMutation({
        mutationFn: (leaveIds: string[]) => bulkApproveLeaves(leaveIds),
        onSuccess: (data, variables) => {
            toast.success(`${variables.length} leave requests approved`, {
                description: "All selected leaves have been approved and moved to HR"
            });
            setSelectedLeaveIds([]);
            setShowBulkConfirm(null);
            queryClient.invalidateQueries({ queryKey: ["manager-pending-leaves"] });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to approve leaves";
            toast.error("Bulk Approval Failed", { description: errorMessage });
        }
    });

    const bulkRejectMutation = useMutation({
        mutationFn: ({ leaveIds, comment }: { leaveIds: string[]; comment: string }) =>
            bulkRejectLeaves(leaveIds, comment),
        onSuccess: (data, variables) => {
            toast.success(`${variables.leaveIds.length} leave requests rejected`);
            setSelectedLeaveIds([]);
            setShowBulkConfirm(null);
            queryClient.invalidateQueries({ queryKey: ["manager-pending-leaves"] });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to reject leaves";
            toast.error("Bulk Rejection Failed", { description: errorMessage });
        }
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = leavesInPending.map(leave => leave.id);
            setSelectedLeaveIds(allIds);
        } else {
            setSelectedLeaveIds([]);
        }
    };

    const handleSelectLeave = (leaveId: string, checked: boolean) => {
        if (checked) {
            setSelectedLeaveIds(prev => [...prev, leaveId]);
        } else {
            setSelectedLeaveIds(prev => prev.filter(id => id !== leaveId));
        }
    };

    const handleBulkApprove = () => {
        bulkApproveMutation.mutate(selectedLeaveIds);
    };

    const handleBulkReject = () => {
        bulkRejectMutation.mutate({
            leaveIds: selectedLeaveIds,
            comment: "Bulk rejected by manager"
        });
    };

    const handleApprove = async (id: string) => {
        try {
            await approveMutation.mutateAsync(id);
            toast.success("Leave approved successfully", {
                description: "Status changed to PROCESSING. The leave will now move to HR for final approval."
            });
            setSelectedLeave(null);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to approve leave";
            const errorString = typeof errorMessage === 'string' ? errorMessage : String(errorMessage);

            // Check for specific error types
            if (error?.response?.status === 403) {
                if (errorString.toLowerCase().includes("reporting manager")) {
                    toast.error("Not Authorized", {
                        description: "You are not the assigned reporting manager for this employee. Only the assigned reporting manager can approve this request."
                    });
                } else {
                    toast.error("Permission Denied", {
                        description: errorString
                    });
                }
            } else if (error?.response?.status === 400) {
                if (errorString.toLowerCase().includes("reporting manager")) {
                    toast.error("No Reporting Manager", {
                        description: "This employee does not have a reporting manager assigned. Please contact HR to assign a reporting manager first."
                    });
                } else {
                    toast.error("Invalid Request", {
                        description: errorString
                    });
                }
            } else {
                toast.error("Approval Failed", {
                    description: errorString
                });
            }
        }
    };

    const handleReject = async (id: string) => {
        try {
            await rejectMutation.mutateAsync(id);
            toast.success("Leave rejected successfully");
            setSelectedLeave(null);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to reject leave";
            const errorString = typeof errorMessage === 'string' ? errorMessage : String(errorMessage);
            toast.error(errorString);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Pending Approvals</CardTitle>
                    <CardDescription>
                        Leave requests from your team members awaiting your approval (Step 1)
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

    const leavesInPending = pendingLeaves?.filter((leave) => leave.status === "PENDING") || [];

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Pending Approvals</CardTitle>
                    <CardDescription>
                        Leave requests from your direct reports with{" "}
                        <Badge variant="secondary">PENDING</Badge> status awaiting your approval (Step 1).
                        After you approve, they will move to HR for final approval.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {leavesInPending.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="mb-4 size-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">No pending approvals</h3>
                            <p className="text-sm text-muted-foreground">
                                Leave requests from your team members will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Bulk Actions */}
                            {selectedLeaveIds.length > 0 && (
                                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                                    <div className="flex items-center gap-2">
                                        <CheckSquare className="size-5 text-blue-600" />
                                        <span className="text-sm font-medium">
                                            {selectedLeaveIds.length} selected
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-green-600 text-green-600 hover:bg-green-50"
                                            onClick={() => setShowBulkConfirm({ action: "approve" })}
                                            disabled={bulkApproveMutation.isPending || bulkRejectMutation.isPending}
                                        >
                                            <Check className="mr-1 size-4" />
                                            Approve Selected
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-red-600 text-red-600 hover:bg-red-50"
                                            onClick={() => setShowBulkConfirm({ action: "reject" })}
                                            disabled={bulkApproveMutation.isPending || bulkRejectMutation.isPending}
                                        >
                                            <X className="mr-1 size-4" />
                                            Reject Selected
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={
                                                        selectedLeaveIds.length === leavesInPending.length &&
                                                        leavesInPending.length > 0
                                                    }
                                                    onCheckedChange={handleSelectAll}
                                                />
                                            </TableHead>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Leave Type</TableHead>
                                            <TableHead>Dates</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Applied On</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leavesInPending.map((leave) => {
                                            const startDate = new Date(leave.startDate);
                                            const endDate = new Date(leave.endDate);
                                            const duration = Math.ceil(
                                                (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                                            ) + 1;
                                            const employeeName = leave.employee
                                                ? `${leave.employee.firstName} ${leave.employee.lastName}`
                                                : "Unknown";
                                            const appliedDate = new Date(leave.createdAt);

                                            return (
                                                <TableRow key={leave.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedLeaveIds.includes(leave.id)}
                                                            onCheckedChange={(checked: boolean) =>
                                                                handleSelectLeave(leave.id, checked as boolean)
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <User className="size-4 text-muted-foreground" />
                                                            {employeeName}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{leave.leaveType?.name || "N/A"}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            <div>{formatDate(leave.startDate)}</div>
                                                            <div className="text-muted-foreground">
                                                                to {formatDate(leave.endDate)}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">
                                                            {duration} {duration === 1 ? "day" : "days"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-xs">
                                                        <p className="truncate text-sm">{leave.reason}</p>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {formatDate(leave.createdAt)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-green-600 text-green-600 hover:bg-green-50"
                                                                onClick={() => setSelectedLeave({ id: leave.id, action: "approve", employeeName })}
                                                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                                            >
                                                                <Check className="mr-1 size-4" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-600 text-red-600 hover:bg-red-50"
                                                                onClick={() => setSelectedLeave({ id: leave.id, action: "reject", employeeName })}
                                                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                                            >
                                                                <X className="mr-1 size-4" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bulk Confirmation Dialog */}
            {showBulkConfirm && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
                    <div className="bg-background p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-lg font-semibold mb-2">
                            {showBulkConfirm.action === "approve"
                                ? "Bulk Approve Leave Requests"
                                : "Bulk Reject Leave Requests"}
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            {showBulkConfirm.action === "approve" ? (
                                <>
                                    You are approving <strong>{selectedLeaveIds.length}</strong> leave requests.
                                    All selected leaves will be moved to HR for final approval.
                                </>
                            ) : (
                                <>
                                    You are rejecting <strong>{selectedLeaveIds.length}</strong> leave requests.
                                    All selected employees will be notified. This action cannot be undone.
                                </>
                            )}
                        </p>

                        <div className="mb-4 rounded-lg border p-3 bg-muted/30">
                            <p className="text-sm font-medium mb-2">Selected Leave Requests:</p>
                            <ul className="text-sm space-y-1 max-h-50 overflow-y-auto">
                                {leavesInPending
                                    .filter(leave => selectedLeaveIds.includes(leave.id))
                                    .map(leave => {
                                        const employeeName = leave.employee
                                            ? `${leave.employee.firstName} ${leave.employee.lastName}`
                                            : "Unknown";
                                        return (
                                            <li key={leave.id} className="flex items-center gap-2">
                                                <Check className="size-3 text-muted-foreground" />
                                                <span>
                                                    {employeeName} - {leave.leaveType?.name} (
                                                    {formatDate(leave.startDate)} to {formatDate(leave.endDate)})
                                                </span>
                                            </li>
                                        );
                                    })}
                            </ul>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowBulkConfirm(null)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (showBulkConfirm.action === "approve") {
                                        handleBulkApprove();
                                    } else {
                                        handleBulkReject();
                                    }
                                }}
                                className={
                                    showBulkConfirm.action === "approve"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                }
                                disabled={bulkApproveMutation.isPending || bulkRejectMutation.isPending}
                            >
                                {bulkApproveMutation.isPending || bulkRejectMutation.isPending ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : null}
                                Confirm{" "}
                                {showBulkConfirm.action === "approve" ? "Approval" : "Rejection"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {selectedLeave && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
                    <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                        <h2 className="text-lg font-semibold mb-2">
                            {selectedLeave.action === "approve" ? "Approve Leave Request" : "Reject Leave Request"}
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            {selectedLeave.action === "approve" ? (
                                <>
                                    You are approving <strong>{selectedLeave.employeeName}</strong>'s leave request.
                                    After your approval (Step 1), this leave will be forwarded to HR for final approval (Step 2).
                                    The employee's leave balance will be deducted only after HR approval.
                                </>
                            ) : (
                                <>
                                    You are rejecting <strong>{selectedLeave.employeeName}</strong>'s leave request.
                                    The employee will be notified of the rejection. This action cannot be undone.
                                </>
                            )}
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setSelectedLeave(null)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (selectedLeave.action === "approve") {
                                        handleApprove(selectedLeave.id);
                                    } else {
                                        handleReject(selectedLeave.id);
                                    }
                                }}
                                className={
                                    selectedLeave.action === "approve"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                }
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                                {approveMutation.isPending || rejectMutation.isPending ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : null}
                                Confirm {selectedLeave.action === "approve" ? "Approval" : "Rejection"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
