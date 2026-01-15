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
import { useSubordinatesLeaves } from "@/lib/queries/leave";
import { Calendar, Loader2, User, AlertTriangle } from "lucide-react";
import { useMemo } from "react";

// Helper function to format dates
import { formatDateInDhaka } from "@/lib/utils";

function formatDate(dateString: string) {
    return formatDateInDhaka(dateString, "long");
}

// Helper to get status color
function getStatusColor(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "APPROVED":
            return "default";
        case "PENDING":
            return "secondary";
        case "PROCESSING":
            return "outline";
        case "REJECTED":
            return "destructive";
        default:
            return "secondary";
    }
}

export function TeamCalendarTab() {
    const { data: teamLeaves, isLoading } = useSubordinatesLeaves();

    // Filter and sort leaves
    const sortedLeaves = useMemo(() => {
        if (!teamLeaves) return [];

        // Sort by start date, most recent first
        return [...teamLeaves].sort((a, b) => {
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });
    }, [teamLeaves]);

    // Check for overlapping leaves (conflict detection)
    const overlappingLeaves = useMemo(() => {
        if (!teamLeaves) return [];

        const approved = teamLeaves.filter(
            (leave) => leave.status === "APPROVED" || leave.status === "PROCESSING"
        );

        const overlaps: Array<{ date: string; employees: string[] }> = [];

        approved.forEach((leave1, i) => {
            const start1 = new Date(leave1.startDate);
            const end1 = new Date(leave1.endDate);
            const emp1Name = leave1.user?.employee
                ? `${leave1.user.employee.firstName} ${leave1.user.employee.lastName}`
                : "Unknown";

            approved.forEach((leave2, j) => {
                if (i >= j) return; // Avoid duplicate comparisons

                const start2 = new Date(leave2.startDate);
                const end2 = new Date(leave2.endDate);

                // Check if dates overlap
                if (start1 <= end2 && start2 <= end1) {
                    const emp2Name = leave2.user?.employee
                        ? `${leave2.user.employee.firstName} ${leave2.user.employee.lastName}`
                        : "Unknown";

                    overlaps.push({
                        date: `${formatDate(leave1.startDate)} - ${formatDate(leave1.endDate)}`,
                        employees: [emp1Name, emp2Name],
                    });
                }
            });
        });

        return overlaps;
    }, [teamLeaves]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Team Leave Calendar</CardTitle>
                    <CardDescription>
                        View all leave requests from your team members
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
        <div className="space-y-4">
            {/* Conflict Warning */}
            {overlappingLeaves.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-800">
                            <AlertTriangle className="size-5" />
                            Leave Conflicts Detected
                        </CardTitle>
                        <CardDescription className="text-orange-700">
                            Multiple team members have overlapping leave dates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {overlappingLeaves.slice(0, 3).map((overlap, index) => (
                                <li key={index} className="text-sm text-orange-800">
                                    <strong>{overlap.date}:</strong> {overlap.employees.join(", ")}
                                </li>
                            ))}
                            {overlappingLeaves.length > 3 && (
                                <li className="text-sm text-orange-600">
                                    +{overlappingLeaves.length - 3} more conflicts
                                </li>
                            )}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Team Leaves Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Team Leave Calendar</CardTitle>
                    <CardDescription>
                        All leave requests from your team members (past, present, and future)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sortedLeaves.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Calendar className="mb-4 size-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">No team leaves</h3>
                            <p className="text-sm text-muted-foreground">
                                Your team members' leave requests will appear here
                            </p>
                        </div>
                    ) : (
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedLeaves.map((leave) => {
                                        const startDate = new Date(leave.startDate);
                                        const endDate = new Date(leave.endDate);
                                        const duration = Math.ceil(
                                            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                                        ) + 1;
                                        const employeeName = leave.user?.employee
                                            ? `${leave.user.employee.firstName} ${leave.user.employee.lastName}`
                                            : "Unknown";

                                        // Check if leave is in the past, present, or future
                                        const today = new Date();
                                        // Use UTC for consistent date comparisons
                                        today.setUTCHours(0, 0, 0, 0);
                                        const isOngoing = startDate <= today && endDate >= today;
                                        const isPast = endDate < today;

                                        return (
                                            <TableRow
                                                key={leave.id}
                                                className={isOngoing ? "bg-blue-50" : isPast ? "opacity-60" : ""}
                                            >
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <User className="size-4 text-muted-foreground" />
                                                        {employeeName}
                                                        {isOngoing && (
                                                            <Badge variant="default" className="ml-2 bg-blue-600">
                                                                On Leave
                                                            </Badge>
                                                        )}
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
                                                    <Badge variant={getStatusColor(leave.status)}>
                                                        {leave.status}
                                                    </Badge>
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
        </div>
    );
}
