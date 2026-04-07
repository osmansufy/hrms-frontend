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
    useApproveLeave,
    usePendingHRApprovals,
    useRejectLeave,
    useOverrideLeave,
} from "@/lib/queries/leave";
import {
    AlertCircle,
    Check,
    Loader2,
    X,
    Edit,
    History,
    FileText,
    ExternalLink,
    ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getLeaveDocumentUrl } from "@/lib/api/leave";
import { EmployeeLeaveHistoryDialog } from "@/components/employee-leave-history-dialog";
import { TableSkeleton } from "@/components/ui/table-skeleton";

import { formatDateInDhaka } from "@/lib/utils";
import { useSession } from "@/components/auth/session-provider";

function formatDate(dateString: string) {
    return formatDateInDhaka(dateString, "long");
}

export function LeaveApprovalsTab() {
    const { session } = useSession();
    const { data: pendingLeaves, isLoading } = usePendingHRApprovals(
        session?.user.roles[0] || ""
    );
    const approveMutation = useApproveLeave();
    const rejectMutation = useRejectLeave();
    const overrideMutation = useOverrideLeave();
    const [selectedLeave, setSelectedLeave] = useState<{
        id: string;
        action: "approve" | "reject";
    } | null>(null);
    const [editingLeave, setEditingLeave] = useState<any | null>(null);
    const [viewHistoryFor, setViewHistoryFor] = useState<{
        userId: string;
        employeeName: string;
    } | null>(null);
    const [editFormData, setEditFormData] = useState({
        startDate: "",
        endDate: "",
        reason: "",
        overrideReason: "",
    });
    const [loadingDocument, setLoadingDocument] = useState<string | null>(null);

    const handleViewDocument = async (leaveId: string) => {
        setLoadingDocument(leaveId);
        try {
            const { url } = await getLeaveDocumentUrl(leaveId);
            window.open(url, "_blank");
        } catch (error: any) {
            toast.error("Failed to load document", {
                description:
                    error?.response?.data?.message || "Unable to access the document",
            });
        } finally {
            setLoadingDocument(null);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await approveMutation.mutateAsync(id);
            toast.success("Leave approved successfully", {
                description:
                    "Status changed to APPROVED. Employee's leave balance has been deducted.",
            });
            setSelectedLeave(null);
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to approve leave";
            const errorString =
                typeof errorMessage === "string" ? errorMessage : String(errorMessage);

            if (error?.response?.status === 400) {
                if (
                    errorString.toLowerCase().includes("processing") ||
                    errorString.toLowerCase().includes("line manager")
                ) {
                    toast.error("Cannot Approve", {
                        description:
                            "Only leave requests with PROCESSING status can be processed by HR.",
                    });
                } else {
                    toast.error("Invalid Request", { description: errorString });
                }
            } else if (error?.response?.status === 403) {
                toast.error("Permission Denied", { description: errorString });
            } else {
                toast.error("Approval Failed", { description: errorString });
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
                description:
                    "The leave details have been overridden with the new information.",
            });
            setEditingLeave(null);
            setEditFormData({
                startDate: "",
                endDate: "",
                reason: "",
                overrideReason: "",
            });
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to override leave";
            toast.error("Override Failed", { description: errorMessage });
        }
    };

    const anyMutating =
        approveMutation.isPending ||
        rejectMutation.isPending ||
        overrideMutation.isPending;

    const leavesInProcessing =
        pendingLeaves?.filter((leave) => leave.status === "PROCESSING") || [];

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-0.5">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ShieldCheck className="size-4 text-muted-foreground" />
                                Leave Approvals (Step 2 — HR)
                            </CardTitle>
                            <CardDescription>
                                Final approval for leave requests in{" "}
                                <Badge variant="secondary" className="text-xs">
                                    PROCESSING
                                </Badge>{" "}
                                status (already approved by line manager).
                            </CardDescription>
                        </div>
                        {leavesInProcessing.length > 0 && (
                            <Badge>{leavesInProcessing.length} pending</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto border-t">
                        {isLoading ? (
                            <div className="p-4">
                                <TableSkeleton columns={9} rows={4} />
                            </div>
                        ) : leavesInProcessing.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                                <AlertCircle className="size-6 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    No pending approvals
                                </span>
                                <span className="max-w-xs text-sm text-muted-foreground">
                                    Leave requests will appear here after line manager
                                    approval.
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
                                            Leave Type
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            Balance
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            Dates
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            Duration
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            Reason
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            Document
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
                                    {leavesInProcessing.map((leave, idx) => {
                                        const startDate = new Date(leave.startDate);
                                        const endDate = new Date(leave.endDate);
                                        const duration =
                                            Math.ceil(
                                                (endDate.getTime() - startDate.getTime()) /
                                                    (1000 * 60 * 60 * 24)
                                            ) + 1;
                                        const balance =
                                            leave?.leaveBalance?.available !== undefined
                                                ? Number(leave.leaveBalance.available)
                                                : 0;
                                        const hasInsufficientBalance =
                                            balance !== 0 && duration > balance;
                                        const rowBg =
                                            idx % 2 !== 0 ? "bg-muted/20" : "";

                                        return (
                                            <TableRow
                                                key={leave.id}
                                                className={`${rowBg} transition-colors hover:bg-muted/40`}
                                            >
                                                <TableCell className="font-medium">
                                                    {leave?.user?.name}
                                                </TableCell>
                                                <TableCell>
                                                    {leave.leaveType?.name || "N/A"}
                                                </TableCell>
                                                <TableCell>
                                                    {balance !== null &&
                                                    typeof balance === "number" ? (
                                                        <div className="flex flex-col">
                                                            <span
                                                                className={
                                                                    hasInsufficientBalance
                                                                        ? "font-semibold text-red-600"
                                                                        : "font-medium"
                                                                }
                                                            >
                                                                {balance.toFixed(1)} days
                                                            </span>
                                                            {hasInsufficientBalance && (
                                                                <span className="mt-0.5 text-xs text-red-500">
                                                                    Insufficient
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div>
                                                            {formatDate(leave.startDate)}
                                                        </div>
                                                        <div className="text-muted-foreground">
                                                            to {formatDate(leave.endDate)}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {duration}{" "}
                                                    {duration === 1 ? "day" : "days"}
                                                </TableCell>
                                                <TableCell className="max-w-[160px] truncate">
                                                    {leave.reason}
                                                </TableCell>
                                                <TableCell>
                                                    {leave.supportingDocumentUrl ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 gap-1 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                            onClick={() =>
                                                                handleViewDocument(
                                                                    leave.id
                                                                )
                                                            }
                                                            disabled={
                                                                loadingDocument ===
                                                                leave.id
                                                            }
                                                        >
                                                            {loadingDocument ===
                                                            leave.id ? (
                                                                <Loader2 className="size-3.5 animate-spin" />
                                                            ) : (
                                                                <FileText className="size-3.5" />
                                                            )}
                                                            View
                                                            <ExternalLink className="size-3" />
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {leave.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {leave.user?.id && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="size-8 text-muted-foreground hover:text-foreground"
                                                                onClick={() =>
                                                                    setViewHistoryFor({
                                                                        userId: leave.user.id,
                                                                        employeeName:
                                                                            leave?.user
                                                                                ?.name ||
                                                                            "Employee",
                                                                    })
                                                                }
                                                                title="View leave history"
                                                            >
                                                                <History className="size-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 gap-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                                                            onClick={() =>
                                                                handleOpenEdit(leave)
                                                            }
                                                            disabled={anyMutating}
                                                        >
                                                            <Edit className="size-3.5" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 gap-1 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                                                            onClick={() =>
                                                                setSelectedLeave({
                                                                    id: leave.id,
                                                                    action: "approve",
                                                                })
                                                            }
                                                            disabled={anyMutating}
                                                        >
                                                            <Check className="size-3.5" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 gap-1 border-red-300 text-red-600 hover:bg-red-50"
                                                            onClick={() =>
                                                                setSelectedLeave({
                                                                    id: leave.id,
                                                                    action: "reject",
                                                                })
                                                            }
                                                            disabled={anyMutating}
                                                        >
                                                            <X className="size-3.5" />
                                                            Reject
                                                        </Button>
                                                    </div>
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

            {/* Edit Dialog */}
            {editingLeave && (
                <Dialog
                    open={!!editingLeave}
                    onOpenChange={(open) => !open && setEditingLeave(null)}
                >
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit Leave Details</DialogTitle>
                            <DialogDescription>
                                Modify the leave dates and reason. Override reason is
                                mandatory.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Start Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={editFormData.startDate}
                                        className="h-9"
                                        onChange={(e) =>
                                            setEditFormData({
                                                ...editFormData,
                                                startDate: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        End Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={editFormData.endDate}
                                        className="h-9"
                                        onChange={(e) =>
                                            setEditFormData({
                                                ...editFormData,
                                                endDate: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Reason
                                </label>
                                <Textarea
                                    value={editFormData.reason}
                                    onChange={(e) =>
                                        setEditFormData({
                                            ...editFormData,
                                            reason: e.target.value,
                                        })
                                    }
                                    placeholder="Leave reason"
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-red-600">
                                    Override Reason *
                                </label>
                                <Textarea
                                    value={editFormData.overrideReason}
                                    onChange={(e) =>
                                        setEditFormData({
                                            ...editFormData,
                                            overrideReason: e.target.value,
                                        })
                                    }
                                    placeholder="Why are you making these changes? (Required)"
                                    rows={3}
                                    className="border-red-200 focus-visible:ring-red-400"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setEditingLeave(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                disabled={overrideMutation.isPending}
                            >
                                {overrideMutation.isPending && (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                )}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Confirmation Dialog */}
            <AlertDialog
                open={!!selectedLeave}
                onOpenChange={(open) => !open && setSelectedLeave(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {selectedLeave?.action === "approve"
                                ? "Approve Leave"
                                : "Reject Leave"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedLeave?.action === "approve"
                                ? "This will approve the leave request and deduct the balance. This action cannot be undone."
                                : "This will reject the leave request. The employee will be notified. This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (selectedLeave?.action === "approve") {
                                    handleApprove(selectedLeave.id);
                                } else if (selectedLeave) {
                                    handleReject(selectedLeave.id);
                                }
                            }}
                            className={
                                selectedLeave?.action === "approve"
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
