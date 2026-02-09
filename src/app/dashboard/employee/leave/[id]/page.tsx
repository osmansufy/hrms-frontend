"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Pencil, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getLeaveDetails } from "@/lib/api/leave";
import { Button } from "@/components/ui/button";
import { LeaveDetailCard } from "@/components/leave/leave-detail-card";
import { ApprovalTimeline } from "@/components/leave/approval-timeline";
import { RelatedAmendmentsTimeline } from "@/components/leave/related-amendments-timeline";
import { LeaveAmendmentDialog } from "@/components/leave/leave-amendment-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default function LeaveDetailPage({ params }: PageProps) {
    const router = useRouter();
    const resolvedParams = use(params);
    const leaveId = resolvedParams.id;
    const [amendmentOpen, setAmendmentOpen] = useState(false);
    const [amendmentMode, setAmendmentMode] = useState<"AMEND" | "CANCEL">("AMEND");

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

            {/* Amendment actions for approved leaves */}
            {leave.status === "APPROVED" && (
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setAmendmentMode("AMEND");
                            setAmendmentOpen(true);
                        }}
                    >
                        <Pencil className="mr-2 size-4" />
                        Amend leave
                    </Button>
                    <Button
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                        onClick={() => {
                            setAmendmentMode("CANCEL");
                            setAmendmentOpen(true);
                        }}
                    >
                        <XCircle className="mr-2 size-4" />
                        Cancel leave
                    </Button>
                </div>
            )}

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

            {/* Related amendment requests for this leave */}
            {leave.relatedAmendments && leave.relatedAmendments.length > 0 && (
                <RelatedAmendmentsTimeline amendments={leave.relatedAmendments} />
            )}

            <LeaveAmendmentDialog
                leave={leave}
                mode={amendmentMode}
                open={amendmentOpen}
                onOpenChange={setAmendmentOpen}
                onSuccess={() => {
                    toast.success(
                        amendmentMode === "AMEND"
                            ? "Amendment request submitted"
                            : "Cancellation request submitted",
                        {
                            description: "Your manager and HR will review the request.",
                        }
                    );
                }}
            />
        </div>
    );
}
