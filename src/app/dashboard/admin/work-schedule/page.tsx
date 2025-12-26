import { WorkScheduleTab } from "../leave/components/work-schedule-tab";

export default function AdminWorkSchedulePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">Work Schedules</h1>
                    <p className="text-sm text-muted-foreground">Manage work schedules for your organization</p>
                </div>
            </div>
            <WorkScheduleTab />
        </div>
    );
}
