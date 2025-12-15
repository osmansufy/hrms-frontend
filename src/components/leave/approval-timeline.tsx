"use client";

import { Check, Clock, X, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LeaveApprovalStep } from "@/lib/api/leave";

type ApprovalTimelineProps = {
    steps: LeaveApprovalStep[];
    currentStatus: string;
};

export function ApprovalTimeline({ steps, currentStatus }: ApprovalTimelineProps) {
    const sortedSteps = [...steps].sort((a, b) => a.approvalLevel - b.approvalLevel);

    const getStepStatus = (step: LeaveApprovalStep) => {
        if (step.action === "APPROVED") return "approved";
        if (step.action === "REJECTED") return "rejected";
        if (currentStatus === "REJECTED" || currentStatus === "CANCELLED") return "skipped";
        return "pending";
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved":
                return <Check className="size-4 text-green-600" />;
            case "rejected":
                return <X className="size-4 text-red-600" />;
            case "pending":
                return <Clock className="size-4 text-amber-600" />;
            default:
                return <Clock className="size-4 text-muted-foreground" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved":
                return "bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-700";
            case "rejected":
                return "bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-700";
            case "pending":
                return "bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700";
            default:
                return "bg-muted border-muted-foreground/20";
        }
    };

    const getApproverName = (step: LeaveApprovalStep) => {
        if (step.approverUser?.employee) {
            return `${step.approverUser.employee.firstName} ${step.approverUser.employee.lastName}`;
        }
        return step.approverUser?.email || "Unknown";
    };

    const getApproverInitials = (step: LeaveApprovalStep) => {
        if (step.approverUser?.employee) {
            return `${step.approverUser.employee.firstName[0]}${step.approverUser.employee.lastName[0]}`.toUpperCase();
        }
        return step.approverUser?.email?.substring(0, 2).toUpperCase() || "??";
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Approval Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sortedSteps.map((step, index) => {
                        const status = getStepStatus(step);
                        const isLast = index === sortedSteps.length - 1;

                        return (
                            <div key={step.id} className="relative">
                                <div className="flex items-start gap-4">
                                    {/* Timeline Line */}
                                    {!isLast && (
                                        <div
                                            className={cn(
                                                "absolute left-5 top-12 h-full w-0.5",
                                                status === "approved"
                                                    ? "bg-green-300 dark:bg-green-700"
                                                    : "bg-muted-foreground/20"
                                            )}
                                        />
                                    )}

                                    {/* Avatar with Status */}
                                    <div className="relative z-10">
                                        <div
                                            className={cn(
                                                "flex size-10 items-center justify-center rounded-full border-2",
                                                getStatusColor(status)
                                            )}
                                        >
                                            <Avatar className="size-8">
                                                <AvatarFallback className="text-xs">
                                                    {getApproverInitials(step)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div
                                            className={cn(
                                                "absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-background",
                                                status === "approved"
                                                    ? "bg-green-500"
                                                    : status === "rejected"
                                                        ? "bg-red-500"
                                                        : status === "pending"
                                                            ? "bg-amber-500"
                                                            : "bg-muted"
                                            )}
                                        >
                                            {getStatusIcon(status)}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-2 pb-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-medium">{getApproverName(step)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Level {step.approvalLevel} Approver
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    status === "approved"
                                                        ? "default"
                                                        : status === "rejected"
                                                            ? "destructive"
                                                            : "secondary"
                                                }
                                                className={cn(
                                                    status === "approved" && "bg-green-500 hover:bg-green-600",
                                                    status === "pending" && "bg-amber-500 hover:bg-amber-600"
                                                )}
                                            >
                                                {status === "approved"
                                                    ? "Approved"
                                                    : status === "rejected"
                                                        ? "Rejected"
                                                        : status === "pending"
                                                            ? "Pending"
                                                            : "Not Started"}
                                            </Badge>
                                        </div>

                                        {step.actionDate && (
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(step.actionDate).toLocaleString(undefined, {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                })}
                                            </p>
                                        )}

                                        {step.comments && (
                                            <div className="rounded-lg border bg-muted/50 p-3">
                                                <p className="text-sm font-medium mb-1">Comments:</p>
                                                <p className="text-sm text-muted-foreground">{step.comments}</p>
                                            </div>
                                        )}

                                        {status === "pending" && !step.actionDate && (
                                            <p className="text-sm italic text-muted-foreground">
                                                Awaiting approval...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {sortedSteps.length === 0 && (
                        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-muted-foreground">
                            <User className="size-5" />
                            <p className="text-sm">No approval steps configured for this leave request.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
