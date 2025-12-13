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
import { useAmendments, useApproveAmendment, useRejectAmendment } from "@/lib/queries/leave";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Helper function to format dates
function formatDate(dateString: string | null | undefined) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

export function AmendmentApprovalsTab() {
    const { data: amendments, isLoading } = useAmendments();
    const approveMutation = useApproveAmendment();
    const rejectMutation = useRejectAmendment();
    const [selectedAmendment, setSelectedAmendment] = useState<{ id: string; action: "approve" | "reject" } | null>(null);

    const handleApprove = async (id: string) => {
        try {
            await approveMutation.mutateAsync(id);
            toast.success("Amendment approved successfully");
            setSelectedAmendment(null);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to approve amendment");
        }
    };

    const handleReject = async (id: string) => {
        try {
            await rejectMutation.mutateAsync(id);
            toast.success("Amendment rejected successfully");
            setSelectedAmendment(null);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to reject amendment");
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Amendment Approvals</CardTitle>
                    <CardDescription>
                        Approve or reject leave amendment requests
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

    const pendingAmendments = amendments?.filter((amendment) => amendment.status === "PENDING" || amendment.status === "PROCESSING") || [];

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Amendment Approvals</CardTitle>
                    <CardDescription>
                        Approve or reject leave amendment requests (changes or cancellations to approved leaves)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {pendingAmendments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="mb-4 size-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">No pending amendments</h3>
                            <p className="text-sm text-muted-foreground">
                                Amendment requests will appear here when employees request changes to approved leaves
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
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
                                        {pendingAmendments.map((amendment) => {
                                            const employeeName = amendment.createdBy?.employee
                                                ? `${amendment.createdBy.employee.firstName} ${amendment.createdBy.employee.lastName}`
                                                : amendment.createdBy?.email || "Unknown";

                                            return (
                                                <TableRow key={amendment.id}>
                                                    <TableCell className="font-medium">{employeeName}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={amendment.changeType === "CANCEL" ? "destructive" : "default"}>
                                                            {amendment.changeType}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {amendment.originalLeave ? (
                                                            <div className="text-sm">
                                                                <div>{formatDate(amendment.originalLeave.startDate)}</div>
                                                                <div className="text-muted-foreground">
                                                                    to {formatDate(amendment.originalLeave.endDate)}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            "N/A"
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {amendment.changeType === "AMEND" ? (
                                                            <div className="text-sm">
                                                                <div>{formatDate(amendment.newStartDate)}</div>
                                                                <div className="text-muted-foreground">
                                                                    to {formatDate(amendment.newEndDate)}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">Cancelled</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="max-w-xs truncate">{amendment.reason}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{amendment.status}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-green-600 text-green-600 hover:bg-green-50"
                                                                onClick={() => setSelectedAmendment({ id: amendment.id, action: "approve" })}
                                                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                                            >
                                                                <Check className="mr-1 size-4" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-600 text-red-600 hover:bg-red-50"
                                                                onClick={() => setSelectedAmendment({ id: amendment.id, action: "reject" })}
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
            {selectedAmendment && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
                    <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                        <h2 className="text-lg font-semibold mb-2">
                            {selectedAmendment.action === "approve" ? "Approve Amendment" : "Reject Amendment"}
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            {selectedAmendment.action === "approve"
                                ? "This will approve the amendment request and update the leave record. Leave balance will be adjusted accordingly."
                                : "This will reject the amendment request. The original leave will remain unchanged."}
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setSelectedAmendment(null)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (selectedAmendment.action === "approve") {
                                        handleApprove(selectedAmendment.id);
                                    } else {
                                        handleReject(selectedAmendment.id);
                                    }
                                }}
                                className={
                                    selectedAmendment.action === "approve"
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
