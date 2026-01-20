"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { formatDateInDhaka, formatTimeInTimezone } from "@/lib/utils";
import { toast } from "sonner";
import { useDepartments } from "@/lib/queries/departments";
import { useTimezone } from "@/contexts/timezone-context";

// Types for reconciliation requests
interface AttendanceReconciliationRequest {
    id: string;
    userId: string;
    attendanceId?: string;
    date: string;
    type: "SIGN_IN" | "SIGN_OUT";
    originalSignIn?: string;
    originalSignOut?: string;
    requestedSignIn?: string;
    requestedSignOut?: string;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    reviewedBy?: string;
    reviewedAt?: string;
    reviewerComment?: string;
    createdAt: string;
    user?: {
        employee?: {
            firstName: string;
            lastName: string;
            department?: {
                name: string;
            };
        };
    };
}

export default function AttendanceReconciliationAdminPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { timezone } = useTimezone();
    const [editingRequest, setEditingRequest] = useState<AttendanceReconciliationRequest | null>(null);
    const [correctedTime, setCorrectedTime] = useState("");
    const [reviewerComment, setReviewerComment] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

    // Fetch departments
    const { data: departments } = useDepartments();

    // Helper to get timezone offset in hours (simplified - works for most cases)
    const getTimezoneOffsetHours = (tz: string): number => {
        // Common timezones - can be expanded
        const offsets: Record<string, number> = {
            "Asia/Dhaka": 6,
            "Asia/Kolkata": 5.5,
            "Asia/Karachi": 5,
            "Asia/Dubai": 4,
            "America/New_York": -5,
            "America/Chicago": -6,
            "America/Los_Angeles": -8,
            "Europe/London": 0,
            "Europe/Paris": 1,
        };
        return offsets[tz] ?? 6; // Default to +6 if unknown
    };

    // Fetch all reconciliation requests (admin/HR)
    const { data, isLoading } = useQuery<AttendanceReconciliationRequest[]>({
        queryKey: ["attendance-reconciliation-requests"],
        queryFn: async () => {
            const res = await apiClient.get("/attendance/reconciliation");
            return res.data;
        },
    });

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.put(`/attendance/reconciliation/${id}/status`, { status: "APPROVED" });
            return res.data;
        },
        onMutate: (id: string) => {
            setPendingRequestId(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance-reconciliation-requests"] });
            toast.success("Reconciliation approved successfully");
            setPendingRequestId(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || "Failed to approve reconciliation";
            toast.error(message);
            setPendingRequestId(null);
        },
    });

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.put(`/attendance/reconciliation/${id}/status`, { status: "REJECTED" });
            return res.data;
        },
        onMutate: (id: string) => {
            setPendingRequestId(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance-reconciliation-requests"] });
            toast.success("Reconciliation rejected successfully");
            setPendingRequestId(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || "Failed to reject reconciliation";
            toast.error(message);
            setPendingRequestId(null);
        },
    });

    // Edit and approve mutation
    const editAndApproveMutation = useMutation({
        mutationFn: async (payload: { id: string; correctedSignIn?: string; correctedSignOut?: string; reviewerComment?: string }) => {
            const { id, ...rest } = payload;
            const mutationPayload: any = {
                status: "APPROVED",
                reviewerComment: rest.reviewerComment || undefined,
            };

            if (rest.correctedSignIn) {
                mutationPayload.correctedSignIn = rest.correctedSignIn;
            }
            if (rest.correctedSignOut) {
                mutationPayload.correctedSignOut = rest.correctedSignOut;
            }

            const res = await apiClient.put(`/attendance/reconciliation/${id}/status`, mutationPayload);
            return res.data;
        },
        onMutate: (payload: { id: string; correctedSignIn?: string; correctedSignOut?: string; reviewerComment?: string }) => {
            setPendingRequestId(payload.id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance-reconciliation-requests"] });
            toast.success("Reconciliation approved successfully");
            setEditingRequest(null);
            setCorrectedTime("");
            setReviewerComment("");
            setPendingRequestId(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || "Failed to approve reconciliation. Please try again.";
            toast.error(message);
            setPendingRequestId(null);
        },
    });

    // Filter data based on department and status
    const filteredData = useMemo(() => {
        if (!data) return [];

        return data.filter((req) => {
            const matchesDepartment = departmentFilter === "all" ||
                req.user?.employee?.department?.name === departmentFilter;
            const matchesStatus = statusFilter === "all" ||
                req.status === statusFilter;

            return matchesDepartment && matchesStatus;
        });
    }, [data, departmentFilter, statusFilter]);

    const handleApprove = (id: string) => {
        approveMutation.mutate(id);
    };

    const handleReject = (id: string) => {
        rejectMutation.mutate(id);
    };

    const handleEditAndApprove = (req: AttendanceReconciliationRequest) => {
        setEditingRequest(req);
        // Pre-fill with employee's requested time - convert UTC to system timezone local time
        const offsetHours = getTimezoneOffsetHours(timezone);
        if (req.type === "SIGN_IN" && req.requestedSignIn) {
            const utcDate = new Date(req.requestedSignIn);
            // Convert UTC to system timezone for datetime-local input
            const localTime = new Date(utcDate.getTime() + (offsetHours * 60 * 60 * 1000));
            setCorrectedTime(localTime.toISOString().slice(0, 16));
        } else if (req.type === "SIGN_OUT" && req.requestedSignOut) {
            const utcDate = new Date(req.requestedSignOut);
            // Convert UTC to system timezone for datetime-local input
            const localTime = new Date(utcDate.getTime() + (offsetHours * 60 * 60 * 1000));
            setCorrectedTime(localTime.toISOString().slice(0, 16));
        } else {
            setCorrectedTime("");
        }
        setReviewerComment("");
    };

    const handleSubmitCorrectedApproval = () => {
        if (!editingRequest) return;

        // Validate that we have either corrected time or employee's requested time
        const hasTime = correctedTime ||
            (editingRequest.type === "SIGN_IN" && editingRequest.requestedSignIn) ||
            (editingRequest.type === "SIGN_OUT" && editingRequest.requestedSignOut);

        if (!hasTime) {
            toast.error("Please provide a corrected time");
            return;
        }

        // Prepare payload
        let correctedSignIn: string | undefined;
        let correctedSignOut: string | undefined;

        // Add corrected time if provided - convert from system timezone to UTC
        if (correctedTime) {
            // datetime-local gives us local time, we need to specify it's in the system timezone
            const offsetHours = getTimezoneOffsetHours(timezone);
            const offsetSign = offsetHours >= 0 ? "+" : "-";
            const offsetHoursAbs = Math.abs(offsetHours);
            const offsetMins = Math.abs((offsetHours % 1) * 60);
            const offsetStr = `${offsetSign}${String(offsetHoursAbs).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
            const dateTimeWithTz = correctedTime + ":00" + offsetStr;
            const correctedDate = new Date(dateTimeWithTz);

            if (editingRequest.type === "SIGN_IN") {
                correctedSignIn = correctedDate.toISOString();
            } else if (editingRequest.type === "SIGN_OUT") {
                correctedSignOut = correctedDate.toISOString();
            }
        }

        editAndApproveMutation.mutate({
            id: editingRequest.id,
            correctedSignIn,
            correctedSignOut,
            reviewerComment: reviewerComment || undefined,
        });
    };

    return (
        <div className="container space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} title="Back">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-semibold">Attendance Reconciliation</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Reconciliation Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex gap-4 mb-6">
                        <div className="w-64">
                            <label className="text-sm font-medium mb-2 block">Department</label>
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments?.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.name}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-48">
                            <label className="text-sm font-medium mb-2 block">Status</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {isLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Employee Name</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Original Time</TableHead>
                                    <TableHead>Requested Time</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                                            No reconciliation requests found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData?.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell>{formatDateInDhaka(req.date, "long")}</TableCell>
                                            <TableCell>
                                                {req.user?.employee
                                                    ? `${req.user.employee.firstName} ${req.user.employee.lastName}`
                                                    : req.userId}
                                            </TableCell>
                                            <TableCell>
                                                {req.user?.employee?.department?.name || "-"}
                                            </TableCell>
                                            <TableCell>{req.type}</TableCell>
                                            <TableCell className="text-sm">
                                                {req.type === "SIGN_IN"
                                                    ? (req.originalSignIn ? formatTimeInTimezone(req.originalSignIn) : "Missing")
                                                    : (req.originalSignOut ? formatTimeInTimezone(req.originalSignOut) : "Missing")}
                                            </TableCell>
                                            <TableCell className="text-sm font-semibold">
                                                {req.type === "SIGN_IN"
                                                    ? (req.requestedSignIn ? formatTimeInTimezone(req.requestedSignIn) : "-")
                                                    : (req.requestedSignOut ? formatTimeInTimezone(req.requestedSignOut) : "-")}
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <p className="truncate text-sm cursor-help">
                                                                {req.reason}
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-md">
                                                            <p className="whitespace-normal">
                                                                {req.reason}
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded text-xs ${req.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                                    req.status === "REJECTED" ? "bg-red-100 text-red-800" :
                                                        "bg-yellow-100 text-yellow-800"
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {req.status === "PENDING" && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApprove(req.id)}
                                                            disabled={!!pendingRequestId}
                                                        >
                                                            {pendingRequestId === req.id && approveMutation.isPending ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    Approving...
                                                                </>
                                                            ) : (
                                                                "Approve"
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => handleEditAndApprove(req)}
                                                            disabled={!!pendingRequestId}
                                                        >
                                                            Edit & Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleReject(req.id)}
                                                            disabled={!!pendingRequestId}
                                                        >
                                                            {pendingRequestId === req.id && rejectMutation.isPending ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    Rejecting...
                                                                </>
                                                            ) : (
                                                                "Reject"
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Time Dialog */}
            <Dialog open={!!editingRequest} onOpenChange={(open) => !open && setEditingRequest(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit & Approve Reconciliation</DialogTitle>
                    </DialogHeader>
                    {editingRequest && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600">Employee: {editingRequest.user?.employee
                                    ? `${editingRequest.user.employee.firstName} ${editingRequest.user.employee.lastName}`
                                    : editingRequest.userId}</p>
                                <p className="text-sm text-gray-600">Date: {formatDateInDhaka(editingRequest.date, "long")}</p>
                                <p className="text-sm text-gray-600">Type: {editingRequest.type}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Original Time</label>
                                <p className="text-sm">
                                    {editingRequest.type === "SIGN_IN"
                                        ? (editingRequest.originalSignIn ? formatTimeInTimezone(editingRequest.originalSignIn) : "Missing")
                                        : (editingRequest.originalSignOut ? formatTimeInTimezone(editingRequest.originalSignOut) : "Missing")}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Employee Requested Time</label>
                                <p className="text-sm font-semibold text-blue-600">
                                    {editingRequest.type === "SIGN_IN"
                                        ? (editingRequest.requestedSignIn ? formatTimeInTimezone(editingRequest.requestedSignIn) : "-")
                                        : (editingRequest.requestedSignOut ? formatTimeInTimezone(editingRequest.requestedSignOut) : "-")}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Corrected Time (Admin Override)
                                    <span className="text-xs text-gray-500 ml-2">(Leave empty to use employee's requested time)</span>
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={correctedTime}
                                    onChange={(e) => setCorrectedTime(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Reason from Employee</label>
                                <p className="text-sm text-gray-700">{editingRequest.reason}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">Reviewer Comment (Optional)</label>
                                <Textarea
                                    value={reviewerComment}
                                    onChange={(e) => setReviewerComment(e.target.value)}
                                    placeholder="Add your comment..."
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingRequest(null)}
                            disabled={editAndApproveMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitCorrectedApproval}
                            disabled={editAndApproveMutation.isPending}
                        >
                            {editAndApproveMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                "Approve with Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
