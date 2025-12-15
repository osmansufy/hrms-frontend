"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, FileText, Bell, DollarSign, Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type PolicySummaryCardProps = {
    policy: {
        leaveType: {
            name: string;
            code: string;
            description?: string | null;
        };
        maxDaysPerYear: number;
        accrualRate?: number | null;
        accrualFrequency?: string | null;
        carryForwardDays?: number | null;
        requireDocThresholdDays?: number | null;
        encashmentEligible?: boolean | null;
        noticeRules?: Array<{
            minLength?: number | null;
            maxLength?: number | null;
            noticeDays: number;
        }>;
    };
};

export function PolicySummaryCard({ policy }: PolicySummaryCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>{policy.leaveType.name}</CardTitle>
                        <CardDescription>
                            <Badge variant="outline" className="mt-1">
                                {policy.leaveType.code}
                            </Badge>
                        </CardDescription>
                    </div>
                    {policy.leaveType.description && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="size-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">{policy.leaveType.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3">
                    {/* Max Days */}
                    <div className="flex items-start gap-3">
                        <Calendar className="size-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">Maximum Days</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {policy.maxDaysPerYear} days/year
                            </p>
                        </div>
                    </div>

                    {/* Accrual */}
                    {policy.accrualRate && (
                        <div className="flex items-start gap-3">
                            <TrendingUp className="size-5 text-green-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Accrual Rate</p>
                                <p className="text-sm text-muted-foreground">
                                    {policy.accrualRate} days per {policy.accrualFrequency || "month"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Carry Forward */}
                    {policy.carryForwardDays !== undefined &&
                        policy.carryForwardDays !== null &&
                        policy.carryForwardDays > 0 && (
                            <div className="flex items-start gap-3">
                                <Calendar className="size-5 text-purple-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Carry Forward</p>
                                    <p className="text-sm text-muted-foreground">
                                        Up to {policy.carryForwardDays} days to next year
                                    </p>
                                </div>
                            </div>
                        )}

                    {/* Notice Period */}
                    {policy.noticeRules && policy.noticeRules.length > 0 && (
                        <div className="flex items-start gap-3">
                            <Bell className="size-5 text-amber-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Notice Period</p>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    {policy.noticeRules.map((rule, index) => (
                                        <p key={index}>
                                            {rule.minLength && rule.maxLength
                                                ? `${rule.minLength}-${rule.maxLength} days leave`
                                                : rule.minLength
                                                    ? `${rule.minLength}+ days leave`
                                                    : rule.maxLength
                                                        ? `Up to ${rule.maxLength} days leave`
                                                        : "Any duration"}
                                            : {rule.noticeDays} days notice
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Document Requirement */}
                    {policy.requireDocThresholdDays && (
                        <div className="flex items-start gap-3">
                            <FileText className="size-5 text-orange-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Document Required</p>
                                <p className="text-sm text-muted-foreground">
                                    For leave &gt; {policy.requireDocThresholdDays} days
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Encashment */}
                    {policy.encashmentEligible && (
                        <div className="flex items-start gap-3">
                            <DollarSign className="size-5 text-emerald-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Encashment</p>
                                <p className="text-sm text-muted-foreground">Eligible for encashment</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
