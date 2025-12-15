"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    generateCalendarGrid,
    mapLeavesToCalendar,
    getLeaveStatusColor,
    getWeekdayNames,
    type CalendarLeave,
} from "@/lib/utils/calendar-helpers";
import { cn } from "@/lib/utils";
import Link from "next/link";

type LeaveCalendarProps = {
    leaves: CalendarLeave[];
    leaveTypes?: Array<{ id: string; name: string; code: string }>;
};

export function LeaveCalendar({ leaves, leaveTypes = [] }: LeaveCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const filteredLeaves = useMemo(() => {
        let filtered = leaves;

        if (statusFilter !== "all") {
            filtered = filtered.filter(leave => {
                const normalizedStatus = leave.status.toUpperCase();
                if (statusFilter === "pending") {
                    return ["PENDING", "APPROVED_BY_MANAGER"].includes(normalizedStatus);
                }
                return normalizedStatus === statusFilter.toUpperCase();
            });
        }

        if (typeFilter !== "all") {
            filtered = filtered.filter(
                leave => leave.leaveTypeName === typeFilter || leave.leaveTypeCode === typeFilter
            );
        }

        return filtered;
    }, [leaves, statusFilter, typeFilter]);

    const calendarGrid = useMemo(() => {
        const grid = generateCalendarGrid(year, month);
        return mapLeavesToCalendar(grid, filteredLeaves);
    }, [year, month, filteredLeaves]);

    const weekdays = getWeekdayNames("short");
    const monthName = currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button variant="outline" onClick={goToToday} className="min-w-35">
                        <Calendar className="mr-2 size-4" />
                        {monthName}
                    </Button>
                    <Button variant="outline" size="icon" onClick={goToNextMonth}>
                        <ChevronRight className="size-4" />
                    </Button>
                </div>

                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-35">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                        </SelectContent>
                    </Select>

                    {leaveTypes.length > 0 && (
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {leaveTypes.map(type => (
                                    <SelectItem key={type.id} value={type.name}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-sm">
                {[
                    { status: "APPROVED", label: "Approved" },
                    { status: "PENDING", label: "Pending" },
                    { status: "REJECTED", label: "Rejected" },
                    { status: "PROCESSING", label: "Processing" },
                ].map(({ status, label }) => {
                    const colors = getLeaveStatusColor(status);
                    return (
                        <div key={status} className="flex items-center gap-2">
                            <div className={cn("size-4 rounded border", colors.bg, colors.border)} />
                            <span className="text-muted-foreground">{label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Calendar Grid */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-7 gap-1">
                        {/* Weekday headers */}
                        {weekdays.map((day: string) => (
                            <div
                                key={day}
                                className="p-2 text-center text-sm font-medium text-muted-foreground"
                            >
                                {day}
                            </div>
                        ))}

                        {/* Calendar days */}
                        {calendarGrid.map((week: any[], weekIndex: number) =>
                            week.map((day: any, dayIndex: number) => {
                                const hasLeaves = day.leaves.length > 0;
                                const primaryLeave = day.leaves[0];
                                const colors = primaryLeave ? getLeaveStatusColor(primaryLeave.status) : null;

                                return (
                                    <div
                                        key={`${weekIndex}-${dayIndex}`}
                                        className={cn(
                                            "min-h-20 rounded-lg border p-2 transition-colors",
                                            !day.isCurrentMonth && "bg-muted/30 text-muted-foreground",
                                            day.isCurrentMonth && "bg-background hover:bg-muted/50",
                                            hasLeaves && colors && cn(colors.bg, colors.border),
                                            day.isPast && "opacity-60"
                                        )}
                                    >
                                        <div className="flex flex-col h-full">
                                            <span
                                                className={cn(
                                                    "text-sm font-medium mb-1",
                                                    hasLeaves && colors?.text
                                                )}
                                            >
                                                {day.date.getDate()}
                                            </span>
                                            {hasLeaves && (
                                                <div className="flex-1 space-y-1">
                                                    {day.leaves.slice(0, 2).map((leave: any) => (
                                                        <Link
                                                            key={leave.id}
                                                            href={`/dashboard/employee/leave/${leave.id}`}
                                                            className="block"
                                                        >
                                                            <div
                                                                className={cn(
                                                                    "rounded px-1 py-0.5 text-xs truncate hover:opacity-80 transition-opacity",
                                                                    getLeaveStatusColor(leave.status).bg,
                                                                    getLeaveStatusColor(leave.status).text
                                                                )}
                                                            >
                                                                {leave.leaveTypeCode}
                                                            </div>
                                                        </Link>
                                                    ))}
                                                    {day.leaves.length > 2 && (
                                                        <div className="text-xs text-muted-foreground">
                                                            +{day.leaves.length - 2} more
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
