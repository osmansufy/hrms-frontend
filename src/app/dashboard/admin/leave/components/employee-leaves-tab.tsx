"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { useAllEmployeeLeaves, useCreateAmendment } from "@/lib/queries/leave";
import { Loader2, Search, FileText, ExternalLink, Pencil, XCircle } from "lucide-react";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";
import { LeaveAmendmentDialog } from "@/components/leave/leave-amendment-dialog";
import { getLeaveDocumentUrl, LeaveRecord } from "@/lib/api/leave";
import { toast } from "sonner";
import { useSession } from "@/components/auth/session-provider";

import { formatDateInDhaka, formatInDhakaTimezone } from "@/lib/utils";

function formatDate(dateString: string) {
    return formatDateInDhaka(dateString, "long");
}

function formatDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startLabel = formatInDhakaTimezone(start, { month: "short", day: "numeric" });
    const endLabel = formatInDhakaTimezone(end, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    return `${startLabel} – ${endLabel}`;
}

export function EmployeeLeavesTab() {
    const { session } = useSession();
    const { data: leaves, isLoading } = useAllEmployeeLeaves();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
    const [loadingDocument, setLoadingDocument] = useState<string | null>(null);
    const [amendmentLeave, setAmendmentLeave] = useState<LeaveRecord | null>(null);
    const [amendmentMode, setAmendmentMode] = useState<"AMEND" | "CANCEL">("AMEND");

    const handleViewDocument = async (leaveId: string) => {
        setLoadingDocument(leaveId);
        try {
            const { url } = await getLeaveDocumentUrl(leaveId);
            window.open(url, '_blank');
        } catch (error: any) {
            toast.error("Failed to load document", {
                description: error?.response?.data?.message || "Unable to access the document"
            });
        } finally {
            setLoadingDocument(null);
        }
    };

    // Get unique statuses and leave types for filters
    const uniqueStatuses = useMemo(() => {
        if (!leaves) return [];
        return [...new Set(leaves.map(l => l.status))];
    }, [leaves]);

    const uniqueLeaveTypes = useMemo(() => {
        if (!leaves) return [];
        return [...new Set(leaves.map(l => l.leaveType?.name || l.leaveTypeId))];
    }, [leaves]);

    // Filter and search leaves
    const filteredLeaves = useMemo(() => {
        if (!leaves) return [];

        return leaves.filter(leave => {
            const matchesSearch =
                !searchTerm ||
                (leave.leaveType?.name?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
                (leave.reason?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
                (leave.id?.toLowerCase() ?? "").includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === "all" || leave.status === statusFilter;

            const matchesLeaveType = leaveTypeFilter === "all" ||
                (leave.leaveType?.name === leaveTypeFilter);

            return matchesSearch && matchesStatus && matchesLeaveType;
        });
    }, [leaves, searchTerm, statusFilter, leaveTypeFilter]);

    // Sort by start date (most recent first)
    const sortedLeaves = useMemo(
        () => [...(filteredLeaves ?? [])].sort((a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        ),
        [filteredLeaves]
    );

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Employee Leave Records</CardTitle>
                    <CardDescription>
                        View all leave requests across the organization
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-center gap-2">
                            <Search className="size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by leave type, reason, or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {uniqueStatuses.map(status => (
                                    <SelectItem key={status} value={status}>
                                        {status}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by leave type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Leave Types</SelectItem>
                                {uniqueLeaveTypes.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Results info */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Showing {sortedLeaves.length} of {leaves?.length ?? 0} leave records
                        </span>
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Loading leave records...</p>
                            </div>
                        </div>
                    ) : sortedLeaves.length === 0 ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <p>No leave records found</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Employee Name</TableHead>
                                        <TableHead>Leave Type</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead>Days</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Document</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-24">Actions</TableHead>
                                        <TableHead>Applied On</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedLeaves.map((leave) => {
                                        const leaveDays = Math.ceil(
                                            (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) /
                                            (1000 * 60 * 60 * 24)
                                        ) + 1;
                                        return (
                                            <TableRow key={leave.id} className="hover:bg-muted/50">
                                                <TableCell className="font-mono text-xs">
                                                    {leave?.user?.employee
                                                        ? `${leave.user.employee.firstName} ${leave.user.employee.lastName}`
                                                        : "Unknown"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span>{leave.leaveType?.name || leave.leaveTypeId}</span>
                                                        {leave.leaveType?.code && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {leave.leaveType.code}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDateRange(leave.startDate, leave.endDate)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{leaveDays} days</Badge>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate text-sm">
                                                    {leave.reason}
                                                </TableCell>
                                                <TableCell>
                                                    {leave.supportingDocumentUrl ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => handleViewDocument(leave.id)}
                                                            disabled={loadingDocument === leave.id}
                                                        >
                                                            {loadingDocument === leave.id ? (
                                                                <Loader2 className="mr-1 size-4 animate-spin" />
                                                            ) : (
                                                                <FileText className="mr-1 size-4" />
                                                            )}
                                                            View
                                                            <ExternalLink className="ml-1 size-3" />
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <LeaveStatusBadge status={leave.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        {leave.status === "APPROVED" && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-blue-600 hover:text-blue-700"
                                                                    onClick={() => {
                                                                        setAmendmentLeave(leave);
                                                                        setAmendmentMode("AMEND");
                                                                    }}
                                                                >
                                                                    <span title="Amend"><Pencil className="size-4" /></span>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-red-600 hover:text-red-700"
                                                                    onClick={() => {
                                                                        setAmendmentLeave(leave);
                                                                        setAmendmentMode("CANCEL");
                                                                    }}
                                                                >
                                                                    <span title="Cancel leave"><XCircle className="size-4" /></span>
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Link href={`/dashboard/employee/leave/${leave.id}`}>
                                                            <Button variant="ghost" size="sm" className="h-8">
                                                                <ExternalLink className="size-4" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(leave.createdAt)}
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

            {/* Amendment dialog (admin create) */}
            {amendmentLeave && (
                <LeaveAmendmentDialog
                    leave={amendmentLeave}
                    mode={amendmentMode}
                    open={!!amendmentLeave}
                    onOpenChange={(open) => !open && setAmendmentLeave(null)}
                    onSuccess={() => {
                        setAmendmentLeave(null);
                        toast.success(
                            amendmentMode === "AMEND"
                                ? "Amendment request created"
                                : "Cancellation request created",
                            { description: "Manager and HR will process the request." }
                        );
                    }}
                />
            )}

            {/* Summary Stats */}
            {leaves && leaves.length > 0 && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Total Leaves</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{leaves.length}</div>
                            <p className="text-xs text-muted-foreground">all records</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {leaves.filter(l => l.status === "APPROVED").length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {((leaves.filter(l => l.status === "APPROVED").length / leaves.length) * 100).toFixed(1)}%
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {leaves.filter(l => l.status === "PENDING").length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {((leaves.filter(l => l.status === "PENDING").length / leaves.length) * 100).toFixed(1)}%
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {leaves.filter(l => l.status === "REJECTED").length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {((leaves.filter(l => l.status === "REJECTED").length / leaves.length) * 100).toFixed(1)}%
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
