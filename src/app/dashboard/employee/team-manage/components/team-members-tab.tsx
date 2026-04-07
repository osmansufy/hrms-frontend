"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useManagerSubordinates } from '@/lib/queries/employees';
import { useSession } from '@/components/auth/session-provider';
import { Eye, ArrowRight, CheckCircle2, Coffee, Plane, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getSubordinateAttendance } from '@/lib/api/attendance';
import type { ExtendedAttendanceRecord } from '@/lib/api/attendance';
import { toStartOfDayISO, toEndOfDayISO } from '@/lib/utils';

function getTodayString() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

type PresenceStatus = "present" | "on_break" | "on_leave" | "absent";

function resolveStatus(record?: ExtendedAttendanceRecord | null): PresenceStatus {
    if (!record) return "absent";
    if (record.isOnLeave) return "on_leave";
    if (record.signIn && record.isOnBreak) return "on_break";
    if (record.signIn) return "present";
    return "absent";
}

const STATUS_BADGE: Record<PresenceStatus, { label: string; icon: React.ElementType; className: string }> = {
    present: { label: "Present", icon: CheckCircle2, className: "border-emerald-300 text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30" },
    on_break: { label: "On Break", icon: Coffee, className: "border-amber-300 text-amber-700 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/30" },
    on_leave: { label: "On Leave", icon: Plane, className: "border-blue-300 text-blue-700 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950/30" },
    absent: { label: "Absent", icon: XCircle, className: "border-red-300 text-red-600 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950/30" },
};

export const TeamMembersTab = () => {
    const router = useRouter();
    const { session } = useSession();
    const employeeId = session?.user.employeeId;

    const { data: managerSubordinates, isLoading: isManagerSubordinatesLoading, error: isManagerSubordinatesError } = useManagerSubordinates(employeeId);

    const today = getTodayString();

    // Fetch today's attendance for each subordinate in parallel for live presence
    const attendanceQueries = useQueries({
        queries: (managerSubordinates ?? []).map((sub) => ({
            queryKey: ["attendance", "manager", "subordinate", sub.userId, "today", today],
            queryFn: async () => {
                if (!sub.userId) return null;
                const result = await getSubordinateAttendance(sub.userId, {
                    startDate: toStartOfDayISO(today),
                    endDate: toEndOfDayISO(today),
                    limit: "1",
                });
                return result.data?.[0] ?? null;
            },
            enabled: Boolean(sub.userId),
            refetchInterval: 2 * 60 * 1000,
            staleTime: 60_000,
        })),
    });

    const presenceMap = useMemo(() => {
        const map = new Map<string, PresenceStatus>();
        (managerSubordinates ?? []).forEach((sub, idx) => {
            const record = attendanceQueries[idx]?.data as ExtendedAttendanceRecord | null | undefined;
            map.set(sub.id, resolveStatus(record));
        });
        return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [managerSubordinates, attendanceQueries.map((q) => q.dataUpdatedAt).join(",")]);
    if (isManagerSubordinatesLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isManagerSubordinatesError && !isManagerSubordinatesLoading && !managerSubordinates) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground">
                        No team members found
                    </p>
                </CardContent>
            </Card>
        );
    }

    const handleViewDetails = (employeeId: string) => {
        router.push(`/dashboard/employee/team-manage/${employeeId}`);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                    {managerSubordinates?.length ?? 0} direct report{(managerSubordinates?.length ?? 0) !== 1 ? "s" : ""} · Live status updates every 2 min
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[150px]">Name</TableHead>
                                <TableHead className="min-w-[100px]">Status</TableHead>
                                <TableHead className="hidden sm:table-cell">Email</TableHead>
                                <TableHead className="hidden md:table-cell">Phone</TableHead>
                                <TableHead className="hidden lg:table-cell">Designation</TableHead>
                                <TableHead className="hidden lg:table-cell">Department</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {managerSubordinates && managerSubordinates.length > 0 ? (
                                managerSubordinates.map((subordinate) => {
                                    const fullName = `${subordinate.firstName} ${subordinate.lastName}`;
                                    const status = presenceMap.get(subordinate.id) ?? "absent";
                                    const statusCfg = STATUS_BADGE[status];
                                    const StatusIcon = statusCfg.icon;
                                    return (
                                        <TableRow
                                            key={subordinate.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleViewDetails(subordinate.id)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{fullName}</span>
                                                    <span className="text-xs text-muted-foreground sm:hidden">
                                                        {subordinate.user?.email || "—"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`gap-1 text-xs font-medium ${statusCfg.className}`}
                                                >
                                                    <StatusIcon className="size-3" />
                                                    {statusCfg.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">{subordinate.user?.email || "—"}</TableCell>
                                            <TableCell className="hidden md:table-cell">{subordinate.phone || "—"}</TableCell>
                                            <TableCell className="hidden lg:table-cell">{subordinate.designation?.name || subordinate.designation?.title || "—"}</TableCell>
                                            <TableCell className="hidden lg:table-cell">{subordinate.department?.name || "—"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetails(subordinate.id);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4 sm:mr-2" />
                                                    <span className="hidden sm:inline">View Details</span>
                                                    <ArrowRight className="h-4 w-4 ml-1 hidden lg:inline" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                        No team members found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

export default TeamMembersTab;