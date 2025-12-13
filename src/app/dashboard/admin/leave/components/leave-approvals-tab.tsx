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
import { useApproveLeave, usePendingHRApprovals, useRejectLeave } from "@/lib/queries/leave";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Helper function to format dates
function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

export function LeaveApprovalsTab() {
    const { data: pendingLeaves, isLoading } = usePendingHRApprovals();
    const approveMutation = useApproveLeave();
    const rejectMutation = useRejectLeave();
    const [selectedLeave, setSelectedLeave] = useState<{ id: string; action: "approve" | "reject" } | null>(null);

    const handleApprove = async (id: string) => {
        try {
            await approveMutation.mutateAsync(id);
            toast.success("Leave approved successfully");
            setSelectedLeave(null);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to approve leave");
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
                        Approve or reject leave requests that have been approved by line managers. These leaves have{" "}
                        <Badge variant="secondary">PROCESSING</Badge> status.
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
                                            const employeeName = leave.user?.employee
                                                ? `${leave.user.employee.firstName} ${leave.user.employee.lastName}`
                                                : leave.user?.email || "Unknown";

                                            return (
                                                <TableRow key={leave.id}>
                                                    <TableCell className="font-medium">{employeeName}</TableCell>
                                                    <TableCell>{leave.leaveType?.name || "N/A"}</TableCell>
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
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-green-600 text-green-600 hover:bg-green-50"
                                                                onClick={() => setSelectedLeave({ id: leave.id, action: "approve" })}
                                                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                                            >
                                                                <Check className="mr-1 size-4" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-600 text-red-600 hover:bg-red-50"
                                                                onClick={() => setSelectedLeave({ id: leave.id, action: "reject" })}
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
        </>
    );
}
