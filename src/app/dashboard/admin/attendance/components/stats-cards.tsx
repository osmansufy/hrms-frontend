"use client";

import { Users, UserCheck, AlertTriangle, Calendar, UserX, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendanceStats } from "@/lib/queries/attendance";
import { toLocalDateStr } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: number;
    total: number;
    description: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    barColor: string;
    loading: boolean;
}

function StatCard({ title, value, total, description, icon: Icon, iconColor, iconBg, barColor, loading }: StatCardProps) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`rounded-md p-1.5 ${iconBg}`}>
                    <Icon className={`size-4 ${iconColor}`} />
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {loading ? (
                    <>
                        <Skeleton className="h-7 w-14" />
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-1.5 w-full rounded-full" />
                    </>
                ) : (
                    <>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold tracking-tight">{value}</span>
                            {total > 0 && (
                                <span className="mb-0.5 text-xs text-muted-foreground">{pct}%</span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export function StatsCards() {
    const today = toLocalDateStr();
    const { data, isLoading } = useAttendanceStats(today);

    const total = data?.totalActive ?? 0;

    const cards: Omit<StatCardProps, "loading" | "total">[] = [
        {
            title:       "Total Active",
            value:       data?.totalActive ?? 0,
            description: "Active employees today",
            icon:        Users,
            iconColor:   "text-slate-600",
            iconBg:      "bg-slate-100 dark:bg-slate-800",
            barColor:    "bg-slate-400",
        },
        {
            title:       "Present",
            value:       data?.present ?? 0,
            description: "Checked in today",
            icon:        UserCheck,
            iconColor:   "text-emerald-600",
            iconBg:      "bg-emerald-50 dark:bg-emerald-950/30",
            barColor:    "bg-emerald-500",
        },
        {
            title:       "Late",
            value:       data?.late ?? 0,
            description: "Arrived after scheduled time",
            icon:        AlertTriangle,
            iconColor:   "text-amber-600",
            iconBg:      "bg-amber-50 dark:bg-amber-950/30",
            barColor:    "bg-amber-500",
        },
        {
            title:       "On Leave",
            value:       data?.onLeave ?? 0,
            description: "On approved leave",
            icon:        Calendar,
            iconColor:   "text-blue-600",
            iconBg:      "bg-blue-50 dark:bg-blue-950/30",
            barColor:    "bg-blue-500",
        },
        {
            title:       "Absent",
            value:       data?.absent ?? 0,
            description: "Not checked in, not on leave",
            icon:        UserX,
            iconColor:   "text-red-600",
            iconBg:      "bg-red-50 dark:bg-red-950/30",
            barColor:    "bg-red-500",
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map((card) => (
                <StatCard key={card.title} {...card} total={total} loading={isLoading} />
            ))}
        </div>
    );
}
