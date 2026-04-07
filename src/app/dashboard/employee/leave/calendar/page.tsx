"use client";

import { useSession } from "@/components/auth/session-provider";
import { useMyLeaves, useLeaveTypes } from "@/lib/queries/leave";
import { LeaveCalendar } from "@/components/leave/leave-calendar";
import { Loader2 } from "lucide-react";

export default function LeaveCalendarPage() {
    const { session } = useSession();
    const userId = session?.user.id;

    const { data: leaves, isLoading: leavesLoading } = useMyLeaves(userId);
    const { data: leaveTypes, isLoading: typesLoading } = useLeaveTypes();

    if (leavesLoading || typesLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const calendarLeaves = (leaves || []).map(leave => ({
        id: leave.id,
        startDate: leave.startDate,
        endDate: leave.endDate,
        status: leave.status,
        leaveTypeName: leave.leaveType?.name || "Unknown",
        leaveTypeCode: leave.leaveType?.code || "???",
    }));

    return (
        <div className="container space-y-6">
            <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Time Away</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">Leave Calendar</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Visualize your leave schedule
                </p>
            </div>

            <LeaveCalendar leaves={calendarLeaves} leaveTypes={leaveTypes} />
        </div>
    );
}
