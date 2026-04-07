"use client";

import { useMemo } from "react";
import { Download, Loader2, ClipboardList, Clock, Coffee, TrendingDown, GitMerge } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExportAttendanceReport } from "@/lib/queries/attendance";
import { toast } from "sonner";
import { AttendanceRecordsTab } from "./components/attendance-records-tab";
import { CreateRecordDialog } from "./components/create-record-dialog";
import { StatsCards } from "./components/stats-cards";
import { TodayAttendanceCard } from "./components/today-attendance";

const NAV_LINKS = [
    { href: "/dashboard/admin/attendance/policies",       icon: ClipboardList, label: "Policies" },
    { href: "/dashboard/admin/work-schedules",            icon: Clock,         label: "Work Schedules" },
    { href: "/dashboard/admin/attendance/breaks",         icon: Coffee,        label: "Break Management" },
    { href: "/dashboard/admin/attendance/reports/lost-hours", icon: TrendingDown, label: "Lost Hours" },
    { href: "/dashboard/admin/attendance/reconciliation", icon: GitMerge,      label: "Reconciliation" },
] as const;

export default function AdminAttendancePage() {
    const exportMutation = useExportAttendanceReport();

    const todayLabel = useMemo(() =>
        new Date().toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric",
        }), []);

    const handleExport = async () => {
        try {
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            const end   = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            const blob  = await exportMutation.mutateAsync({
                startDate: start.toISOString().split("T")[0]!,
                endDate:   end.toISOString().split("T")[0]!,
                format:    "csv",
            });
            const url = URL.createObjectURL(blob);
            const a   = document.createElement("a");
            a.href     = url;
            a.download = `attendance-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Report downloaded");
        } catch {
            toast.error("Failed to export report");
        }
    };

    return (
        <div className="container space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {todayLabel}
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">Attendance</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Monitor presence, approve records, and export reports
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <CreateRecordDialog />
                    <Button
                        onClick={handleExport}
                        disabled={exportMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        {exportMutation.isPending
                            ? <Loader2 className="size-4 animate-spin" />
                            : <Download className="size-4" />
                        }
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* ── Today's stats ── */}
            <StatsCards />

            {/* ── Quick-nav strip ── */}
            <div className="flex flex-wrap gap-2">
                {NAV_LINKS.map(({ href, icon: Icon, label }) => (
                    <Link key={href} href={href}>
                        <Button variant="outline" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                            <Icon className="size-3.5" />
                            {label}
                        </Button>
                    </Link>
                ))}
            </div>

            {/* ── Tabs ── */}
            <Tabs defaultValue="today" className="space-y-4">
                <div className="border-b">
                    <TabsList className="h-auto w-max min-w-full justify-start gap-0 rounded-none border-0 bg-transparent p-0">
                        {([
                            { value: "today",   label: "Today's Attendance" },
                            { value: "records", label: "All Records" },
                        ] as const).map(({ value, label }) => (
                            <TabsTrigger
                                key={value}
                                value={value}
                                className="
                                    relative whitespace-nowrap rounded-none border-0 bg-transparent
                                    px-5 py-2.5 text-sm font-medium text-muted-foreground shadow-none
                                    transition-colors hover:text-foreground
                                    data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none
                                    after:absolute after:bottom-0 after:left-0 after:right-0
                                    after:h-0.5 after:rounded-full after:bg-primary after:scale-x-0
                                    data-[state=active]:after:scale-x-100 after:transition-transform after:duration-200
                                "
                            >
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

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
