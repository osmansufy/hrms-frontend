"use client";

import { useSession } from "@/components/auth/session-provider";
import { useLeaveTypes } from "@/lib/queries/leave";
import { PolicySummaryCard } from "@/components/leave/policy-summary-card";
import { Loader2, BookOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LeavePoliciesPage() {
    const { session } = useSession();
    const userId = session?.user.id;

    const {
        data: leaveTypes,
        isLoading,
        error,
    } = useLeaveTypes();

    const policies =
        leaveTypes
            ?.filter((lt) => lt.leavePolicy?.maxDays != null)
            .map((lt) => ({
                id: lt.id,
                leaveType: {
                    name: lt.name,
                    code: lt.code,
                    description: lt.description ?? null,
                },
                maxDaysPerYear: Number(lt.leavePolicy?.maxDays ?? 0),
                carryForwardDays: lt.leavePolicy?.carryForwardCap ?? null,
                requireDocThresholdDays: lt.leavePolicy?.requireDocThresholdDays ?? null,
                encashmentEligible: lt.leavePolicy?.encashmentFlag ?? null,
                noticeRules: lt.leavePolicy ? [] : [],
                accrualRate: null,
                accrualFrequency: null,
            })) ?? [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container space-y-6">
                <div className="flex items-start gap-3">
                    <BookOpen className="size-6 text-blue-600 mt-1" />
                    <div>
                        <h1 className="text-2xl font-semibold">Leave Policies</h1>
                        <p className="text-sm text-muted-foreground">
                            Understanding your leave entitlements and requirements
                        </p>
                    </div>
                </div>
                <Alert variant="destructive">
                    <AlertDescription>
                        {error instanceof Error ? error.message : "Failed to load leave policies"}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container space-y-6">
            <div className="flex items-start gap-3">
                <BookOpen className="size-6 text-blue-600 mt-1" />
                <div>
                    <h1 className="text-2xl font-semibold">Leave Policies</h1>
                    <p className="text-sm text-muted-foreground">
                        Understanding your leave entitlements and requirements
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {policies.map((policy: any) => (
                    <PolicySummaryCard key={policy.id} policy={policy} />
                ))}
            </div>

            {policies.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="size-12 text-muted-foreground mb-3" />
                    <h3 className="font-semibold text-lg mb-1">No policies found</h3>
                    <p className="text-sm text-muted-foreground">
                        No leave policies are currently assigned to you
                    </p>
                </div>
            )}
        </div>
    );
}
