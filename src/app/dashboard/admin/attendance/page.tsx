"use client";

import { Download, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExportAttendanceReport } from "@/lib/queries/attendance";
import { toast } from "sonner";
import { AttendanceRecordsTab } from "./components/attendance-records-tab";
import { CreateRecordDialog } from "./components/create-record-dialog";
import { StatsCards } from "./components/stats-cards";
import { TodayAttendanceCard } from "./components/today-attendance";

export default function AdminAttendancePage() {
    const exportMutation = useExportAttendanceReport();

    const handleExport = async () => {
        try {
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            const blob = await exportMutation.mutateAsync({
                startDate: start.toISOString().split("T")[0],
                endDate: end.toISOString().split("T")[0],
                format: "csv",
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `attendance-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Report downloaded");
        } catch (err) {
            console.error(err);
            toast.error("Failed to export report");
        }
    };

    return (
        <div className="container space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">Time & Presence</p>
                    <h1 className="text-2xl font-semibold">Attendance</h1>
                </div>
                <div className="flex gap-2">
                    <CreateRecordDialog />
                    <Button onClick={handleExport} disabled={exportMutation.isPending} variant="outline">
                        {exportMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                        <Download className="mr-2 size-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <StatsCards />
            <div className="flex gap-2">
                <Link href="/dashboard/admin/attendance/policies"><Button variant="secondary">Policies</Button></Link>
                <Link href="/dashboard/admin/work-schedules"><Button variant="secondary">Work Schedules</Button></Link>
                <Link href="/dashboard/admin/attendance/reports/lost-hours"><Button variant="secondary">Lost Hours</Button></Link>
                <Link href="/dashboard/admin/attendance/reconciliation"><Button variant="secondary">Reconciliation</Button></Link>
            </div>
            <Tabs defaultValue="today" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="records">All Records</TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="space-y-4">
                    <TodayAttendanceCard />
                </TabsContent>

                <TabsContent value="records" className="space-y-4">
                    <AttendanceRecordsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}


