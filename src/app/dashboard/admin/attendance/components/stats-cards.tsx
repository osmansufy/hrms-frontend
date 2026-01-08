"use client";

import { Users, UserCheck, Clock, UserX, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAttendanceStats } from "@/lib/queries/attendance";

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    loading,
}: {
    title: string;
    value: number;
    description: string;
    icon: React.ElementType;
    loading: boolean;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-7 w-20 animate-pulse rounded bg-muted" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

export function StatsCards() {
    const today = new Date().toISOString().split("T")[0];
    const { data, isLoading } = useAttendanceStats(today);

    const stats = [
        {
            title: "Total Active",
            value: data?.totalActive ?? 0,
            description: "Total active employees",
            icon: Users,
        },
        {
            title: "Present",
            value: data?.present ?? 0,
            description: "Employees checked in today",
            icon: UserCheck,
        },
        {
            title: "Late",
            value: data?.late ?? 0,
            description: "Employees checked in late",
            icon: Clock,
        },
        {
            title: "On Leave",
            value: data?.onLeave ?? 0,
            description: "Employees on approved leave",
            icon: Calendar,
        },
        {
            title: "Absent",
            value: data?.absent ?? 0,
            description: "Employees not checked in (excluding leave)",
            icon: UserX,
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {stats.map((stat) => (
                <StatCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    description={stat.description}
                    icon={stat.icon}
                    loading={isLoading}
                />
            ))}
        </div>
    );
}
