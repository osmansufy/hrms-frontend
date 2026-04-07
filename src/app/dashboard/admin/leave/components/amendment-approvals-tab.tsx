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
import {
    useAmendments,
    useApproveAmendment,
    useRejectAmendment,
} from "@/lib/queries/leave";
import { AlertCircle, Check, Loader2, X, FileEdit } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/table-skeleton";

import { formatDateInDhaka } from "@/lib/utils";
import { useSession } from "@/components/auth/session-provider";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";

function formatDate(dateString: string | null | undefined) {
    if (!dateString) return "N/A";
    return formatDateInDhaka(dateString, "long");
}

const AMENDMENT_STATUS_OPTIONS = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
] as const;

export function AmendmentApprovalsTab() {
    const { session } = useSession();
    const { data: amendments, isLoading } = useAmendments(
        session?.user.roles[0] || ""
    );
    const approveMutation = useApproveAmendment();
    const rejectMutation = useRejectAmendment();
    const [selectedAmendment, setSelectedAmendment] = useState<{
        id: string;
        action: "approve" | "reject";
    } | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("pending");

    const filteredAmendments = useMemo(() => {
        if (!amendments) return [];
        if (statusFilter === "all") return amendments;
        if (statusFilter === "pending") {
            return amendments.filter(
                (a) => a.status === "PENDING" || a.status === "PROCESSING"
            );
        }
        return amendments.filter((a) => a.status === statusFilter);
    }, [amendments, statusFilter]);

    const handleApprove = async (id: string) => {
        try {
            await approveMutation.mutateAsync(id);
            toast.success("Amendment approved successfully", {
                description:
                    "The leave has been updated and balance adjusted if needed.",
            });
            setSelectedAmendment(null);
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to approve amendment";
            const errorString =
                typeof errorMessage === "string"
                    ? errorMessage
                    : String(errorMessage);

            if (error?.response?.status === 403) {
                toast.error("Permission Denied", {
                    description:
                        "You don't have permission to approve this amendment.",
                });
            } else if (error?.response?.status === 404) {
                toast.error("Not Found", {
                    description:
                        "The amendment or original leave could not be found.",
                });
            } else {
                toast.error("Approval Failed", { description: errorString });
            }
        }
    };

    const handleReject = async (id: string) => {
        try {
            await rejectMutation.mutateAsync(id);
            toast.success("Amendment rejected successfully");
            setSelectedAmendment(null);
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to reject amendment";
            toast.error("Rejection Failed", {
                description:
                    typeof errorMessage === "string"
                        ? errorMessage
                        : String(errorMessage),
            });
        }
    };

    const anyMutating =
        approveMutation.isPending || rejectMutation.isPending;

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-0.5">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileEdit className="size-4 text-muted-foreground" />
                                Amendment requests
                            </CardTitle>
                            <CardDescription>
                                Review changes or cancellations to approved leaves.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="h-9 w-[130px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {AMENDMENT_STATUS_OPTIONS.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">
                                {filteredAmendments.length} of{" "}
                                {amendments?.length ?? 0}
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto border-t">
                        {isLoading ? (
                            <div className="p-4">
                                <TableSkeleton columns={7} rows={4} />
                            </div>
                        ) : filteredAmendments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                                <AlertCircle className="size-6 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    {statusFilter === "pending"
                                        ? "No pending amendments"
                                        : "No amendments"}
                                </span>
                                <span className="max-w-xs text-sm text-muted-foreground">
                                    {statusFilter === "pending"
                                        ? "Amendment requests will appear here when employees or admins request changes to approved leaves."
                                        : "Try a different status filter."}
                                </span>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">
                                            Employee
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            Type
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            Original Dates
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            New Dates
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            Reason
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            Status
                                        </TableHead>
                                        <TableHead className="font-semibold text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAmendments.map((amendment, idx) => {
                                        const employeeName =
                                            amendment.createdBy?.employee
                                                ? `${amendment.createdBy.employee.firstName} ${amendment.createdBy.employee.lastName}`
                                                : amendment.createdBy?.email ||
                                                  "Unknown";
                                        const canAct =
                                            amendment.status === "PENDING" ||
                                            amendment.status === "PROCESSING";
                                        const rowBg =
                                            idx % 2 !== 0 ? "bg-muted/20" : "";

                                        return (
                                            <TableRow
                                                key={amendment.id}
                                                className={`${rowBg} transition-colors hover:bg-muted/40`}
                                            >
                                                <TableCell className="font-medium">
                                                    {employeeName}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            amendment.changeType ===
                                                            "CANCEL"
                                                                ? "destructive"
                                                                : "default"
                                                        }
                                                    >
                                                        {amendment.changeType}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {amendment.originalLeave ? (
                                                        <div className="text-sm">
                                                            <div>
                                                                {formatDate(
                                                                    amendment
                                                                        .originalLeave
                                                                        .startDate
                                                                )}
                                                            </div>
                                                            <div className="text-muted-foreground">
                                                                to{" "}
                                                                {formatDate(
                                                                    amendment
                                                                        .originalLeave
                                                                        .endDate
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        "N/A"
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {amendment.changeType ===
                                                    "AMEND" ? (
                                                        <div className="text-sm">
                                                            <div>
                                                                {formatDate(
                                                                    amendment.newStartDate
                                                                )}
                                                            </div>
                                                            <div className="text-muted-foreground">
                                                                to{" "}
                                                                {formatDate(
                                                                    amendment.newEndDate
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            Cancelled
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="max-w-[180px] truncate">
                                                    {amendment.reason}
                                                </TableCell>
                                                <TableCell>
                                                    <LeaveStatusBadge
                                                        status={amendment.status}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {canAct ? (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 gap-1 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                                                                onClick={() =>
                                                                    setSelectedAmendment(
                                                                        {
                                                                            id: amendment.id,
                                                                            action: "approve",
                                                                        }
                                                                    )
                                                                }
                                                                disabled={
                                                                    anyMutating
                                                                }
                                                            >
                                                                <Check className="size-3.5" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 gap-1 border-red-300 text-red-600 hover:bg-red-50"
                                                                onClick={() =>
                                                                    setSelectedAmendment(
                                                                        {
                                                                            id: amendment.id,
                                                                            action: "reject",
                                                                        }
                                                                    )
                                                                }
                                                                disabled={
                                                                    anyMutating
                                                                }
                                                            >
                                                                <X className="size-3.5" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <AlertDialog
                open={!!selectedAmendment}
                onOpenChange={(open) => !open && setSelectedAmendment(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {selectedAmendment?.action === "approve"
                                ? "Approve Amendment"
                                : "Reject Amendment"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedAmendment?.action === "approve"
                                ? "This will approve the amendment request and update the leave record. Leave balance will be adjusted accordingly."
                                : "This will reject the amendment request. The original leave will remain unchanged."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (selectedAmendment?.action === "approve") {
                                    handleApprove(selectedAmendment.id);
                                } else if (selectedAmendment) {
                                    handleReject(selectedAmendment.id);
                                }
                            }}
                            className={
                                selectedAmendment?.action === "approve"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            }
                            disabled={anyMutating}
                        >
                            {anyMutating && (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
