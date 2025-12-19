"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LeaveBalance } from "@/lib/api/leave";
import { Calendar, TrendingUp, AlertCircle } from "lucide-react";

interface LeaveBalanceCardProps {
    balance: LeaveBalance;
    showDetails?: boolean;
    onClick?: () => void;
}

export function LeaveBalanceCard({
    balance,
    showDetails = false,
    onClick,
}: LeaveBalanceCardProps) {
    // Handle both flat and nested structures
    const leaveTypeName = balance.leaveTypeName || "Unknown";
    const leaveTypeDescription = null;
    const leavePolicy = balance.policy || null;

    const totalAllocated = balance.available + balance.carried;
    const available = balance.available;
    const carryForward = balance.carried;
    const percentage = totalAllocated > 0 ? (available / totalAllocated) * 100 : 0;

    const getStatusColor = () => {
        if (percentage >= 50) return "bg-green-500";
        if (percentage >= 25) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getStatusBadge = () => {
        if (percentage >= 50)
            return (
                <Badge className="bg-green-500 hover:bg-green-600">Good Balance</Badge>
            );
        if (percentage >= 25)
            return (
                <Badge className="bg-yellow-500 hover:bg-yellow-600">
                    Limited Balance
                </Badge>
            );
        return (
            <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Low Balance
            </Badge>
        );
    };

    return (
        <Card
            className={`transition-all hover:shadow-md ${onClick ? "cursor-pointer" : ""}`}
            onClick={onClick}
        >
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                        {leaveTypeName}
                    </CardTitle>
                    {getStatusBadge()}
                </div>
                {leaveTypeDescription && (
                    <p className="text-sm text-muted-foreground">
                        {leaveTypeDescription}
                    </p>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Balance Summary */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Available</span>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold">{available}</span>
                            <span className="text-sm text-muted-foreground ml-1">days</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <Progress value={percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                                {available} of {totalAllocated} days remaining
                            </span>
                            <span>{Math.round(percentage)}%</span>
                        </div>
                    </div>

                    {/* Carry Forward Info */}
                    {carryForward > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            <span className="text-muted-foreground">
                                Includes {carryForward} carried forward days
                            </span>
                        </div>
                    )}

                    {/* Additional Details */}
                    {showDetails && leavePolicy && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                            {leavePolicy.maxDays && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Max Days per Year</span>
                                    <span className="font-medium">
                                        {leavePolicy.maxDays}
                                    </span>
                                </div>
                            )}
                            {leavePolicy.carryForwardCap && leavePolicy.carryForwardCap > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Carry Forward Cap
                                    </span>
                                    <span className="font-medium">
                                        {leavePolicy.carryForwardCap}
                                    </span>
                                </div>
                            )}
                            {leavePolicy.encashmentFlag && (
                                <Badge variant="outline" className="mt-2">
                                    Encashment Available
                                </Badge>
                            )}
                            {"allowAdvance" in leavePolicy && (leavePolicy as any).allowAdvance && (
                                <Badge variant="outline" className="mt-2 ml-2">
                                    Advance Allowed
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
