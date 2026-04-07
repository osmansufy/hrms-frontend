"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useManagerSubordinates } from "@/lib/queries/employees";
import { getSubordinateAttendance } from "@/lib/api/attendance";
import type { ExtendedAttendanceRecord } from "@/lib/api/attendance";
import {
  Users,
  CheckCircle2,
  Coffee,
  Plane,
  XCircle,
  Clock,
  RefreshCw,
  LogIn,
  LogOut,
  Timer,
} from "lucide-react";
import { toStartOfDayISO, toEndOfDayISO } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

// ──────────────────────────────────────────────────────────────
// Types & helpers
// ──────────────────────────────────────────────────────────────

type PresenceStatus = "present" | "on_break" | "on_leave" | "absent";

interface MemberPresence {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string;
  status: PresenceStatus;
  signIn: string | null;
  signOut: string | null;
  isLate: boolean;
  breakType?: string | null;
  breakSince?: string | null;
  leaveType?: string | null;
  workedMinutes?: number;
}

function getTodayString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function resolveStatus(record?: ExtendedAttendanceRecord | null): PresenceStatus {
  if (!record) return "absent";
  if (record.isOnLeave) return "on_leave";
  if (record.signIn && record.isOnBreak) return "on_break";
  if (record.signIn) return "present";
  return "absent";
}

const STATUS_CONFIG: Record<
  PresenceStatus,
  { label: string; textColor: string; bgColor: string; borderColor: string; icon: React.ElementType }
> = {
  present: {
    label: "Present",
    textColor: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  on_break: {
    label: "On Break",
    textColor: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    icon: Coffee,
  },
  on_leave: {
    label: "On Leave",
    textColor: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    icon: Plane,
  },
  absent: {
    label: "Absent",
    textColor: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    icon: XCircle,
  },
};

// ──────────────────────────────────────────────────────────────
// Summary stat card
// ──────────────────────────────────────────────────────────────

function StatCard({
  status,
  count,
  total,
}: {
  status: PresenceStatus;
  count: number;
  total: number;
}) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-4 ${cfg.bgColor} ${cfg.borderColor}`}
    >
      <div className={`rounded-full p-2 bg-white/60 dark:bg-black/20`}>
        <Icon className={`size-5 ${cfg.textColor}`} />
      </div>
      <div>
        <p className={`text-2xl font-bold leading-none ${cfg.textColor}`}>{count}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {cfg.label} ({pct}%)
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Member presence card
// ──────────────────────────────────────────────────────────────

function MemberCard({ member }: { member: MemberPresence }) {
  const cfg = STATUS_CONFIG[member.status];
  const Icon = cfg.icon;

  return (
    <div
      className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${cfg.bgColor} ${cfg.borderColor}`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="bg-white/70 dark:bg-black/30 text-sm font-semibold">
            {getInitials(member.firstName, member.lastName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold text-sm leading-tight">
              {member.firstName} {member.lastName}
            </p>
            <Badge
              variant="outline"
              className={`shrink-0 gap-1 text-xs font-medium border ${cfg.textColor} ${cfg.borderColor} bg-white/50 dark:bg-black/20`}
            >
              <Icon className="size-3" />
              {cfg.label}
            </Badge>
          </div>

          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {member.designation || member.department || "—"}
          </p>

          <div className="mt-3 space-y-1.5">
            {/* Sign in time */}
            {member.signIn && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <LogIn className="size-3 shrink-0" />
                <span>In: <span className="font-medium text-foreground">{formatTime(member.signIn)}</span></span>
                {member.isLate && (
                  <Badge variant="destructive" className="h-4 px-1 text-[10px]">Late</Badge>
                )}
              </div>
            )}

            {/* Sign out time */}
            {member.signOut && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <LogOut className="size-3 shrink-0" />
                <span>Out: <span className="font-medium text-foreground">{formatTime(member.signOut)}</span></span>
              </div>
            )}

            {/* Worked hours */}
            {member.status === "present" && typeof member.workedMinutes === "number" && member.workedMinutes > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3 shrink-0" />
                <span>Worked: <span className="font-medium text-foreground">{formatDuration(member.workedMinutes)}</span></span>
              </div>
            )}

            {/* Break info */}
            {member.status === "on_break" && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Timer className="size-3 shrink-0" />
                <span>
                  {member.breakType
                    ? member.breakType.charAt(0) + member.breakType.slice(1).toLowerCase()
                    : "Break"}{" "}
                  since{" "}
                  <span className="font-medium text-foreground">{formatTime(member.breakSince)}</span>
                </span>
              </div>
            )}

            {/* Leave type */}
            {member.status === "on_leave" && member.leaveType && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Plane className="size-3 shrink-0" />
                <span className="font-medium text-foreground">{member.leaveType}</span>
              </div>
            )}

            {/* Absent */}
            {member.status === "absent" && (
              <p className="text-xs text-muted-foreground">Not signed in today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────

export function TeamPresenceTab() {
  const queryClient = useQueryClient();

  const {
    data: subordinates,
    isLoading: isSubordinatesLoading,
  } = useManagerSubordinates();

  const today = getTodayString();

  // Fetch today's attendance for each subordinate in parallel
  const attendanceQueries = useQueries({
    queries: (subordinates ?? []).map((sub) => ({
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
      refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
      staleTime: 60_000,
    })),
  });

  const isAttendanceLoading = attendanceQueries.some((q) => q.isLoading);

  const members: MemberPresence[] = useMemo(() => {
    if (!subordinates) return [];
    return subordinates.map((sub, idx) => {
      const record = (attendanceQueries[idx]?.data as ExtendedAttendanceRecord | null | undefined) ?? null;
      const status = resolveStatus(record);
      return {
        id: sub.id,
        userId: sub.userId ?? sub.id,
        firstName: sub.firstName,
        lastName: sub.lastName,
        designation: sub.designation?.name ?? sub.designation?.title ?? "",
        department: sub.department?.name ?? "",
        status,
        signIn: record?.signIn ?? null,
        signOut: record?.signOut ?? null,
        isLate: record?.isLate ?? false,
        breakType: record?.activeBreak ? (record as any).activeBreakType ?? null : null,
        breakSince: record?.activeBreak?.startTime ?? null,
        leaveType: record?.leave?.leaveType?.name ?? null,
        workedMinutes: record?.workedMinutes,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subordinates, attendanceQueries.map((q) => q.dataUpdatedAt).join(",")]);

  const counts = useMemo(
    () =>
      members.reduce(
        (acc, m) => {
          acc[m.status]++;
          return acc;
        },
        { present: 0, on_break: 0, on_leave: 0, absent: 0 } as Record<PresenceStatus, number>,
      ),
    [members],
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) &&
        q.queryKey[0] === "attendance" &&
        q.queryKey[2] === "subordinate",
    });
  };

  if (isSubordinatesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Presence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subordinates || subordinates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Presence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No team members found.</p>
        </CardContent>
      </Card>
    );
  }

  const total = members.length;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Group members by status for ordered display
  const grouped: MemberPresence[] = [
    ...members.filter((m) => m.status === "present"),
    ...members.filter((m) => m.status === "on_break"),
    ...members.filter((m) => m.status === "on_leave"),
    ...members.filter((m) => m.status === "absent"),
  ];

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Today's Presence</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="size-3" />
            As of {timeStr} · Auto-refreshes every 2 min
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isAttendanceLoading}
          className="gap-2"
        >
          <RefreshCw className={`size-3.5 ${isAttendanceLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard status="present" count={counts.present} total={total} />
        <StatCard status="on_break" count={counts.on_break} total={total} />
        <StatCard status="on_leave" count={counts.on_leave} total={total} />
        <StatCard status="absent" count={counts.absent} total={total} />
      </div>

      {/* Member cards */}
      {isAttendanceLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subordinates.map((s) => (
            <Skeleton key={s.id} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {grouped.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
