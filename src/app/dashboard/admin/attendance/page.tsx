"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useExportAttendanceReport } from "@/lib/queries/attendance";
import { CreateRecordDialog } from "./components/create-record-dialog";
import { AttendanceRecordsTab } from "./components/attendance-records-tab";
import { StatsCards } from "./components/stats-cards";
import { TodayAttendanceCard } from "./components/today-attendance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

function formatTime(value?: string | null) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "—";
    }
}

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
        <div className="space-y-6">
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
                <Link href="/dashboard/admin/attendance/policy-assignments"><Button variant="secondary">Assignments</Button></Link>
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


