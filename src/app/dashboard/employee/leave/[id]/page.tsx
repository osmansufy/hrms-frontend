"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLeaveDetails } from "@/lib/api/leave";
import { Button } from "@/components/ui/button";
import { LeaveDetailCard } from "@/components/leave/leave-detail-card";
import { ApprovalTimeline } from "@/components/leave/approval-timeline";
import { Alert, AlertDescription } from "@/components/ui/alert";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default function LeaveDetailPage({ params }: PageProps) {
    const router = useRouter();
    const resolvedParams = use(params);
    const leaveId = resolvedParams.id;

    const { data: leave, isLoading, error } = useQuery({
        queryKey: ["leave-details", leaveId],
        queryFn: () => getLeaveDetails(leaveId),
        enabled: !!leaveId,
    });

    if (isLoading) {
        return (
            <div className="container space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold">Leave Request Details</h1>
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                </div>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (error || !leave) {
        return (
            <div className="container space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold">Leave Request Details</h1>
                        <p className="text-sm text-muted-foreground">Error loading details</p>
                    </div>
                </div>
                <Alert variant="destructive">
                    <AlertDescription>
                        {error instanceof Error ? error.message : "Failed to load leave request details. Please try again."}
                    </AlertDescription>
                </Alert>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="container space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="size-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold">Leave Request Details</h1>
                    <p className="text-sm text-muted-foreground">
                        Request ID: {leave.id.substring(0, 8)}...
                    </p>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Leave Details */}
                <div>
                    <LeaveDetailCard leave={leave} />
                </div>

                {/* Approval Timeline */}
                <div>
                    <ApprovalTimeline
                        steps={leave.approvalSteps}
                        currentStatus={leave.status}
                    />
                </div>
            </div>
        </div>
    );
}
