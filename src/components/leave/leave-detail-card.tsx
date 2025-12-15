"use client";

import { Calendar, FileText, TrendingDown, User, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";
import { Separator } from "@/components/ui/separator";
import type { LeaveDetails } from "@/lib/api/leave";

type LeaveDetailCardProps = {
    leave: LeaveDetails;
};

export function LeaveDetailCard({ leave }: LeaveDetailCardProps) {
    const employeeName = leave.user.employee
        ? `${leave.user.employee.firstName} ${leave.user.employee.lastName}`
        : leave.user.email;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle>Leave Request Details</CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{leave.leaveType.code}</Badge>
                            <LeaveStatusBadge status={leave.status} />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Employee Info */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="size-4" />
                        <span className="font-medium">Employee Information</span>
                    </div>
                    <div className="grid gap-2 rounded-lg border bg-muted/50 p-4">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Name</span>
                            <span className="text-sm font-medium">{employeeName}</span>
                        </div>
                        {leave.user.employee?.employeeCode && (
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Employee Code</span>
                                <span className="text-sm font-medium">{leave.user.employee.employeeCode}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Email</span>
                            <span className="text-sm font-medium">{leave.user.email}</span>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Leave Details */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="size-4" />
                        <span className="font-medium">Leave Details</span>
                    </div>
                    <div className="grid gap-3">
                        <div className="grid gap-2 rounded-lg border bg-muted/50 p-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Leave Type</span>
                                <span className="text-sm font-medium">{leave.leaveType.name}</span>
                            </div>
                            {leave.leaveType.description && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Description</span>
                                    <span className="text-sm font-medium text-right max-w-50">
                                        {leave.leaveType.description}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2 rounded-lg border p-4">
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Start Date</span>
                                <span className="text-sm font-medium text-right">{formatDate(leave.startDate)}</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">End Date</span>
                                <span className="text-sm font-medium text-right">{formatDate(leave.endDate)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-medium">Total Duration</span>
                                <span className="text-lg font-bold text-blue-600">{leave.totalDays} days</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Reason */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="size-4" />
                        <span className="font-medium">Reason</span>
                    </div>
                    <div className="rounded-lg border bg-muted/50 p-4">
                        <p className="text-sm">{leave.reason}</p>
                    </div>
                </div>

                {/* Balance Impact */}
                {leave.balanceImpact && (
                    <>
                        <Separator />
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <TrendingDown className="size-4" />
                                <span className="font-medium">Balance Impact</span>
                            </div>
                            <div className="grid gap-2 rounded-lg border p-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Balance Before</span>
                                    <span className="text-sm font-medium">{leave.balanceImpact.balanceBefore} days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Deducted</span>
                                    <span className="text-sm font-medium text-red-600">
                                        -{leave.balanceImpact.deducted} days
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Balance After</span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {leave.balanceImpact.balanceAfter} days
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Supporting Document */}
                {leave.supportingDocumentUrl && (
                    <>
                        <Separator />
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="size-4" />
                                <span className="font-medium">Supporting Document</span>
                            </div>
                            <a
                                href={leave.supportingDocumentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                            >
                                <FileText className="size-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-600 hover:underline">
                                    View Document
                                </span>
                            </a>
                        </div>
                    </>
                )}

                <Separator />

                {/* Timestamps */}
                <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Clock className="size-3" />
                        <span>Created: {formatDateTime(leave.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="size-3" />
                        <span>Last Updated: {formatDateTime(leave.updatedAt)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
