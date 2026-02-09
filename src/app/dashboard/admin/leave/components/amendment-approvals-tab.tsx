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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAmendments, useApproveAmendment, useRejectAmendment } from "@/lib/queries/leave";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { formatDateInDhaka } from "@/lib/utils";
import { useSession } from "@/components/auth/session-provider";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";

// Helper function to format dates
function formatDate(dateString: string | null | undefined) {
    if (!dateString) return "N/A";
    return formatDateInDhaka(dateString, "long");
}

const AMENDMENT_STATUS_FILTER_OPTIONS = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
] as const;

export function AmendmentApprovalsTab() {
    const { session } = useSession();
    const { data: amendments, isLoading } = useAmendments(session?.user.roles[0] || "");
    const approveMutation = useApproveAmendment();
    const rejectMutation = useRejectAmendment();
    const [selectedAmendment, setSelectedAmendment] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("pending");

    const filteredAmendments = useMemo(() => {
        if (!amendments) return [];
        if (statusFilter === "all") return amendments;
        if (statusFilter === "pending") {
            return amendments.filter((a) => a.status === "PENDING" || a.status === "PROCESSING");
        }
        return amendments.filter((a) => a.status === statusFilter);
    }, [amendments, statusFilter]);

    const handleApprove = async (id: string) => {
        try {
            await approveMutation.mutateAsync(id);
            toast.success("Amendment approved successfully", {
                description: "The leave has been updated and balance adjusted if needed."
            });
            setSelectedAmendment(null);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to approve amendment";
            const errorString = typeof errorMessage === 'string' ? errorMessage : String(errorMessage);

            if (error?.response?.status === 403) {
                toast.error("Permission Denied", {
                    description: "You don't have permission to approve this amendment. Only the reporting manager or HR can approve."
                });
            } else if (error?.response?.status === 404) {
                toast.error("Not Found", {
                    description: "The amendment or original leave could not be found."
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
            toast.success("Amendment rejected successfully");
            setSelectedAmendment(null);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to reject amendment";
            toast.error("Rejection Failed", {
                description: typeof errorMessage === 'string' ? errorMessage : String(errorMessage)
            });
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

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Amendment requests</CardTitle>
                    <CardDescription>
                        View all amendment requests. Approve or reject pending ones (changes or cancellations to approved leaves).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex items-center gap-2">
                        <span className="text-sm font-medium">Status:</span>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {AMENDMENT_STATUS_FILTER_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">
                            {filteredAmendments.length} of {amendments?.length ?? 0} request(s)
                        </span>
                    </div>
                    {filteredAmendments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="mb-4 size-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">
                                {statusFilter === "pending" ? "No pending amendments" : "No amendments"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {statusFilter === "pending"
                                    ? "Amendment requests will appear here when employees or admins request changes to approved leaves."
                                    : "Try a different status filter."}
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
                                        {filteredAmendments.map((amendment) => {
                                            const employeeName = amendment.createdBy?.employee
                                                ? `${amendment.createdBy.employee.firstName} ${amendment.createdBy.employee.lastName}`
                                                : amendment.createdBy?.email || "Unknown";
                                            const canApproveReject =
                                                amendment.status === "PENDING" || amendment.status === "PROCESSING";

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
                                                        <LeaveStatusBadge status={amendment.status} />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {canApproveReject ? (
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
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">—</span>
                                                        )}
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
