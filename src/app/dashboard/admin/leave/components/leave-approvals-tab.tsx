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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useApproveLeave, usePendingHRApprovals, useRejectLeave, useOverrideLeave, useAllUsersBalances } from "@/lib/queries/leave";
import { AlertCircle, Check, Loader2, X, Edit, History } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { EmployeeLeaveHistoryDialog } from "@/components/employee-leave-history-dialog";

import { formatDateInDhaka } from "@/lib/utils";

// Helper function to format dates
function formatDate(dateString: string) {
    return formatDateInDhaka(dateString, "long");
}

export function LeaveApprovalsTab() {
    const { data: pendingLeaves, isLoading } = usePendingHRApprovals();
    const { data: allBalances } = useAllUsersBalances();
    const approveMutation = useApproveLeave();
    const rejectMutation = useRejectLeave();
    const overrideMutation = useOverrideLeave();
    const [selectedLeave, setSelectedLeave] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
    const [editingLeave, setEditingLeave] = useState<any | null>(null);
    const [viewHistoryFor, setViewHistoryFor] = useState<{ userId: string; employeeName: string } | null>(null);
    const [editFormData, setEditFormData] = useState({
        startDate: "",
        endDate: "",
        reason: "",
        overrideReason: "",
    });

    // Create a map of userId + leaveTypeId -> balance for quick lookup
    const balanceMap = useMemo(() => {
        const map = new Map<string, number>();
        if (allBalances) {
            allBalances.forEach((balance) => {
                const key = `${balance.userId}-${balance.leaveTypeId}`;
                const available = typeof balance.available === 'number' ? balance.available : Number(balance.available) || 0;
                map.set(key, available);
            });
        }
        return map;
    }, [allBalances]);

    // Helper function to get balance for a specific leave
    const getLeaveBalance = (userId: string, leaveTypeId: string): number | null => {
        const key = `${userId}-${leaveTypeId}`;
        const balance = balanceMap.get(key);
        return balance !== undefined ? balance : null;
    };

    const handleApprove = async (id: string) => {
        try {
            await approveMutation.mutateAsync(id);
            toast.success("Leave approved successfully", {
                description: "Status changed to APPROVED. Employee's leave balance has been deducted."
            });
            setSelectedLeave(null);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to approve leave";
            const errorString = typeof errorMessage === 'string' ? errorMessage : String(errorMessage);

            // Check for specific error types
            if (error?.response?.status === 400) {
                if (errorString.toLowerCase().includes("processing") || errorString.toLowerCase().includes("line manager")) {
                    toast.error("Cannot Approve", {
                        description: "Only leave requests with PROCESSING status (approved by Line Manager) can be processed by HR. This leave may still be PENDING or already processed."
                    });
                } else {
                    toast.error("Invalid Request", {
                        description: errorString
                    });
                }
            } else if (error?.response?.status === 403) {
                toast.error("Permission Denied", {
                    description: errorString
                });
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
            toast.error(error?.response?.data?.message || "Failed to reject leave");
        }
    };

    const handleOpenEdit = (leave: any) => {
        setEditingLeave(leave);
        setEditFormData({
            startDate: leave.startDate.split("T")[0],
            endDate: leave.endDate.split("T")[0],
            reason: leave.reason,
            overrideReason: leave.overrideReason || "",
        });
    };

    const handleSaveEdit = async () => {
        if (!editingLeave || !editFormData.overrideReason.trim()) {
            toast.error("Override reason is required");
            return;
        }

        try {
            const payload = {
                id: editingLeave.id,
                data: {
                    startDate: editFormData.startDate,
                    endDate: editFormData.endDate,
                    reason: editFormData.reason,
                    overrideReason: editFormData.overrideReason,
                },
            };
            await overrideMutation.mutateAsync(payload);
            toast.success("Leave updated successfully", {
                description: "The leave details have been overridden with the new information.",
            });
            setEditingLeave(null);
            setEditFormData({ startDate: "", endDate: "", reason: "", overrideReason: "" });
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to override leave";
            toast.error("Override Failed", {
                description: errorMessage,
            });
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Leave Approvals (Step 2 - HR)</CardTitle>
                    <CardDescription>
                        Approve or reject leave requests that have been approved by line managers
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

    const leavesInProcessing = pendingLeaves?.filter((leave) => leave.status === "PROCESSING") || [];

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Leave Approvals (Step 2 - HR)</CardTitle>
                    <CardDescription>
                        Final approval for leave requests. Only leaves with{" "}
                        <Badge variant="secondary">PROCESSING</Badge> status (already approved by Line Manager at Step 1) can be processed here.
                        Your approval will change status to APPROVED and deduct the leave balance.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {leavesInProcessing.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="mb-4 size-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">No pending approvals</h3>
                            <p className="text-sm text-muted-foreground">
                                Leave requests will appear here after line manager approval
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Leave Type</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>Dates</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leavesInProcessing.map((leave) => {
                                            const startDate = new Date(leave.startDate);
                                            const endDate = new Date(leave.endDate);
                                            const duration = Math.ceil(
                                                (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                                            ) + 1;
                                            const balance = leave.user?.id && leave.leaveTypeId
                                                ? getLeaveBalance(leave.user.id, leave.leaveTypeId)
                                                : null;
                                            const hasInsufficientBalance = balance !== null && duration > balance;

                                            return (
                                                <TableRow key={leave.id}>
                                                    <TableCell className="font-medium">{leave?.user?.name}</TableCell>
                                                    <TableCell>{leave.leaveType?.name || "N/A"}</TableCell>
                                                    <TableCell>
                                                        {balance !== null && typeof balance === 'number' ? (
                                                            <div className="flex flex-col">
                                                                <span className={hasInsufficientBalance ? "font-semibold text-red-600" : "font-medium"}>
                                                                    {balance.toFixed(1)} days
                                                                </span>
                                                                {hasInsufficientBalance && (
                                                                    <span className="text-xs text-red-500 mt-0.5">
                                                                        Insufficient
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">—</span>
                                                        )}
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
                                                        {duration} {duration === 1 ? "day" : "days"}
                                                    </TableCell>
                                                    <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{leave.status}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {leave.user?.id && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-muted-foreground hover:text-foreground"
                                                                    onClick={() => setViewHistoryFor({
                                                                        userId: leave.user.id,
                                                                        employeeName: leave?.user?.name || "Employee"
                                                                    })}
                                                                    title="View leave history"
                                                                >
                                                                    <History className="size-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                                                onClick={() => handleOpenEdit(leave)}
                                                                disabled={approveMutation.isPending || rejectMutation.isPending || overrideMutation.isPending}
                                                            >
                                                                <Edit className="mr-1 size-4" />
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-green-600 text-green-600 hover:bg-green-50"
                                                                onClick={() => setSelectedLeave({ id: leave.id, action: "approve" })}
                                                                disabled={approveMutation.isPending || rejectMutation.isPending || overrideMutation.isPending}
                                                            >
                                                                <Check className="mr-1 size-4" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-600 text-red-600 hover:bg-red-50"
                                                                onClick={() => setSelectedLeave({ id: leave.id, action: "reject" })}
                                                                disabled={approveMutation.isPending || rejectMutation.isPending || overrideMutation.isPending}
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

            {/* Edit Dialog */}
            {editingLeave && (
                <Dialog open={!!editingLeave} onOpenChange={(open) => !open && setEditingLeave(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit Leave Details</DialogTitle>
                            <DialogDescription>
                                Modify the leave dates and reason. Override reason is mandatory.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Date</label>
                                    <Input
                                        type="date"
                                        value={editFormData.startDate}
                                        onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">End Date</label>
                                    <Input
                                        type="date"
                                        value={editFormData.endDate}
                                        onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Reason</label>
                                <Textarea
                                    value={editFormData.reason}
                                    onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                                    placeholder="Leave reason"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-red-600">Override Reason *</label>
                                <Textarea
                                    value={editFormData.overrideReason}
                                    onChange={(e) => setEditFormData({ ...editFormData, overrideReason: e.target.value })}
                                    placeholder="Why are you making these changes? (Required)"
                                    rows={3}
                                    className="border-red-200"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingLeave(null)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                disabled={overrideMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {overrideMutation.isPending ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : null}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Confirmation Dialog */}
            {selectedLeave && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
                    <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                        <h2 className="text-lg font-semibold mb-2">
                            {selectedLeave.action === "approve" ? "Approve Leave" : "Reject Leave"}
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            {selectedLeave.action === "approve"
                                ? "This will approve the leave request and deduct the balance from the employee's leave account. This action cannot be undone."
                                : "This will reject the leave request. The employee will be notified. This action cannot be undone."}
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
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave History Dialog */}
            {viewHistoryFor && (
                <EmployeeLeaveHistoryDialog
                    open={!!viewHistoryFor}
                    onOpenChange={(open) => !open && setViewHistoryFor(null)}
                    userId={viewHistoryFor.userId}
                    employeeName={viewHistoryFor.employeeName}
                />
            )}
        </>
    );
}
