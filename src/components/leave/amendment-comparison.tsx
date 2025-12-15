"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AmendmentComparisonProps = {
    original: {
        startDate: string;
        endDate: string;
        reason: string;
        totalDays: number;
    };
    amended: {
        startDate: string;
        endDate: string;
        reason: string;
        totalDays: number;
    };
    balanceImpact?: {
        currentBalance: number;
        originalDeduction: number;
        newDeduction: number;
        refund: number;
        finalBalance: number;
    };
};

export function AmendmentComparison({
    original,
    amended,
    balanceImpact,
}: AmendmentComparisonProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const isDateChanged =
        original.startDate !== amended.startDate || original.endDate !== amended.endDate;
    const isReasonChanged = original.reason !== amended.reason;
    const isDaysChanged = original.totalDays !== amended.totalDays;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Amendment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Date Comparison */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Leave Dates</p>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-center">
                            <div
                                className={`rounded-lg border p-3 ${isDateChanged ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" : "bg-muted/50"}`}
                            >
                                <p className="text-xs text-muted-foreground mb-1">Original</p>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">{formatDate(original.startDate)}</p>
                                    <p className="text-xs text-muted-foreground">to</p>
                                    <p className="text-sm font-medium">{formatDate(original.endDate)}</p>
                                </div>
                                <Badge variant="outline" className="mt-2">
                                    {original.totalDays} days
                                </Badge>
                            </div>

                            <div className="flex justify-center">
                                <ArrowRight className="size-5 text-muted-foreground" />
                            </div>

                            <div
                                className={`rounded-lg border p-3 ${isDateChanged ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : "bg-muted/50"}`}
                            >
                                <p className="text-xs text-muted-foreground mb-1">Amended</p>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">{formatDate(amended.startDate)}</p>
                                    <p className="text-xs text-muted-foreground">to</p>
                                    <p className="text-sm font-medium">{formatDate(amended.endDate)}</p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={`mt-2 ${isDaysChanged ? "border-green-500 text-green-700 dark:text-green-300" : ""}`}
                                >
                                    {amended.totalDays} days
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Reason Comparison */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Reason</p>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-center">
                            <div
                                className={`rounded-lg border p-3 ${isReasonChanged ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" : "bg-muted/50"}`}
                            >
                                <p className="text-xs text-muted-foreground mb-1">Original</p>
                                <p className="text-sm">{original.reason}</p>
                            </div>

                            <div className="flex justify-center">
                                <ArrowRight className="size-5 text-muted-foreground" />
                            </div>

                            <div
                                className={`rounded-lg border p-3 ${isReasonChanged ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : "bg-muted/50"}`}
                            >
                                <p className="text-xs text-muted-foreground mb-1">Amended</p>
                                <p className="text-sm">{amended.reason}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Balance Impact */}
            {balanceImpact && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Balance Impact</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Current Balance</span>
                                <span className="text-sm font-medium">
                                    {balanceImpact.currentBalance} days
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Original Deduction</span>
                                <span className="text-sm font-medium text-red-600">
                                    -{balanceImpact.originalDeduction} days
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">New Deduction</span>
                                <span className="text-sm font-medium text-red-600">
                                    -{balanceImpact.newDeduction} days
                                </span>
                            </div>

                            {balanceImpact.refund !== 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">
                                        {balanceImpact.refund > 0 ? "Refund" : "Additional Deduction"}
                                    </span>
                                    <span
                                        className={`text-sm font-bold ${balanceImpact.refund > 0 ? "text-green-600" : "text-red-600"}`}
                                    >
                                        {balanceImpact.refund > 0 ? "+" : ""}
                                        {balanceImpact.refund} days
                                    </span>
                                </div>
                            )}

                            <div className="border-t pt-3 flex justify-between items-center">
                                <span className="text-sm font-medium">Final Balance</span>
                                <span className="text-lg font-bold text-blue-600">
                                    {balanceImpact.finalBalance} days
                                </span>
                            </div>
                        </div>

                        {balanceImpact.refund > 0 ? (
                            <Alert variant="success" className="mt-4">
                                <AlertDescription>
                                    This change will refund {balanceImpact.refund} days to your balance
                                </AlertDescription>
                            </Alert>
                        ) : balanceImpact.refund < 0 ? (
                            <Alert variant="warning" className="mt-4">
                                <AlertDescription>
                                    This change will deduct an additional {Math.abs(balanceImpact.refund)}{" "}
                                    days from your balance
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert variant="info" className="mt-4">
                                <AlertDescription>
                                    This change will not affect your balance
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
