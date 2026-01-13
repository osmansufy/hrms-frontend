"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listLeavesByUser, getAllUsersBalances } from "@/lib/api/leave";
import { formatDateInDhaka } from "@/lib/utils";
import { useMemo } from "react";

interface EmployeeLeaveHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    employeeName: string;
}

function formatDate(dateString: string) {
    return formatDateInDhaka(dateString, "long");
}

function getStatusBadgeVariant(status: string) {
    const normalized = status.toUpperCase();
    if (normalized === "APPROVED") return "default";
    if (normalized === "PENDING") return "secondary";
    if (normalized === "PROCESSING") return "outline";
    if (normalized === "REJECTED") return "destructive";
    return "outline";
}

export function EmployeeLeaveHistoryDialog({
    open,
    onOpenChange,
    userId,
    employeeName,
}: EmployeeLeaveHistoryDialogProps) {
    const { data: leaves, isLoading } = useQuery({
        queryKey: ["leave-history", userId],
        queryFn: () => listLeavesByUser(userId),
        enabled: open && !!userId,
    });

    const { data: allBalances, isLoading: balancesLoading } = useQuery({
        queryKey: ["all-users-balances"],
        queryFn: () => getAllUsersBalances(),
        enabled: open,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Filter balances for this specific user
    const userBalances = useMemo(() => {
        if (!allBalances || !userId) return [];
        return allBalances.filter((balance) => balance.userId === userId);
    }, [allBalances, userId]);

    // Create a map of leaveTypeId -> balance for quick lookup
    const balanceMap = useMemo(() => {
        const map = new Map<string, number>();
        userBalances.forEach((balance) => {
            const available = typeof balance.available === 'number'
                ? balance.available
                : Number(balance.available) || 0;
            map.set(balance.leaveTypeId, available);
        });
        return map;
    }, [userBalances]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Leave History - {employeeName}</DialogTitle>
                    <DialogDescription>
                        Complete leave history for this employee
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                ) : !leaves || leaves.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-sm text-muted-foreground">
                            No leave history found for this employee
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Leave Type</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Applied On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaves
                                    .sort((a, b) => {
                                        // Sort by start date, most recent first
                                        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                                    })
                                    .map((leave) => {
                                        const startDate = new Date(leave.startDate);
                                        const endDate = new Date(leave.endDate);
                                        const duration = Math.ceil(
                                            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                                        ) + 1;

                                        return (
                                            <TableRow key={leave.id}>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {leave.leaveType?.name || "N/A"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDate(leave.startDate)}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDate(leave.endDate)}
                                                </TableCell>
                                                <TableCell>
                                                    {duration} {duration === 1 ? "day" : "days"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(leave.status)}>
                                                        {leave.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    <p className="truncate text-sm">{leave.reason}</p>
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
            </DialogContent>
        </Dialog>
    );
}
