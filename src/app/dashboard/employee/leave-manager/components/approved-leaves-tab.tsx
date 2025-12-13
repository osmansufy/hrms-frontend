"use client";

import { Badge } from "@/components/ui/badge";
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
import { useManagerApprovedLeaves } from "@/lib/queries/leave";
import { AlertCircle, Clock, Loader2, User } from "lucide-react";

// Helper function to format dates
function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

export function ApprovedLeavesTab() {
    const { data: approvedLeaves, isLoading } = useManagerApprovedLeaves();

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Awaiting HR Approval</CardTitle>
                    <CardDescription>
                        Leaves you've approved that are waiting for HR's final approval (Step 2)
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

    const leavesInProcessing = approvedLeaves?.filter((leave) => leave.status === "PROCESSING") || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Awaiting HR Approval</CardTitle>
                <CardDescription>
                    Leave requests you've approved with{" "}
                    <Badge variant="secondary">PROCESSING</Badge> status.
                    These are now waiting for HR's final approval (Step 2).
                </CardDescription>
            </CardHeader>
            <CardContent>
                {leavesInProcessing.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Clock className="mb-4 size-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">No leaves awaiting HR</h3>
                        <p className="text-sm text-muted-foreground">
                            Leaves you approve will appear here while waiting for HR's final approval
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
                                        <TableHead>Your Approval</TableHead>
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

                                        // Find Step 1 approval
                                        const step1Approval = leave.approvals?.find((approval) => approval.step === 1);

                                        return (
                                            <TableRow key={leave.id}>
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
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                        <Clock className="mr-1 size-3" />
                                                        {leave.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {step1Approval && step1Approval.actedAt ? (
                                                        <div className="text-sm">
                                                            <div className="text-green-600 font-medium">✓ Approved</div>
                                                            <div className="text-muted-foreground">
                                                                {formatDate(step1Approval.actedAt)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="size-4" />
                            <p>
                                These leaves are awaiting HR's final approval. Once HR approves, the employee's leave balance will be deducted.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
