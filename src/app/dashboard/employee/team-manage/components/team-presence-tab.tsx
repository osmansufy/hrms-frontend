"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getTeamPresence, type TeamMemberPresence } from "@/lib/api/attendance";
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
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

// ──────────────────────────────────────────────────────────────
// Types & helpers
// ──────────────────────────────────────────────────────────────

type PresenceStatus = "present" | "on_break" | "on_leave" | "absent";

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

function resolveStatus(member: TeamMemberPresence): PresenceStatus {
  if (member.isOnLeave) return "on_leave";
  if (member.signIn && member.isOnBreak) return "on_break";
  if (member.signIn) return "present";
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
// Break status banner — shown when anyone is on break
// ──────────────────────────────────────────────────────────────

function BreakStatusBanner({ members }: { members: Array<TeamMemberPresence & { status: PresenceStatus }> }) {
  const onBreak = members.filter((m) => m.status === "on_break");
  if (onBreak.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Coffee className="size-4 text-amber-600 dark:text-amber-400" />
        <span className="font-semibold text-sm text-amber-700 dark:text-amber-400">
          {onBreak.length} team member{onBreak.length > 1 ? "s" : ""} currently on break
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {onBreak.map((m) => (
          <div
            key={m.employeeId}
            className="flex items-center gap-2 rounded-md bg-white/60 dark:bg-black/20 border border-amber-200 dark:border-amber-700 px-3 py-1.5 text-xs"
          >
            <Avatar className="size-5 shrink-0">
              <AvatarFallback className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                {getInitials(m.firstName, m.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">
              {m.firstName} {m.lastName}
            </span>
            {m.activeBreak && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-amber-700 dark:text-amber-400">
                  {m.activeBreak.breakType.charAt(0) +
                    m.activeBreak.breakType.slice(1).toLowerCase().replace(/_/g, " ")}
                </span>
                <span className="text-muted-foreground">since {formatTime(m.activeBreak.startTime)}</span>
                {typeof m.activeBreak.durationMinutes === "number" && (
                  <Badge variant="outline" className="h-4 px-1 text-[10px] border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400">
                    {formatDuration(m.activeBreak.durationMinutes)}
                  </Badge>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <div className="rounded-full p-2 bg-white/60 dark:bg-black/20">
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

function MemberCard({ member, status }: { member: TeamMemberPresence; status: PresenceStatus }) {
  const cfg = STATUS_CONFIG[status];
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
            {member.designation?.title || member.department?.name || "—"}
          </p>

          <div className="mt-3 space-y-1.5">
            {member.signIn && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <LogIn className="size-3 shrink-0" />
                <span>
                  In: <span className="font-medium text-foreground">{formatTime(member.signIn)}</span>
                </span>
                {member.isLate && (
                  <Badge variant="destructive" className="h-4 px-1 text-[10px]">Late</Badge>
                )}
              </div>
            )}

            {member.signOut && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <LogOut className="size-3 shrink-0" />
                <span>
                  Out: <span className="font-medium text-foreground">{formatTime(member.signOut)}</span>
                </span>
              </div>
            )}

            {status === "present" && member.workedMinutes > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3 shrink-0" />
                <span>
                  Worked:{" "}
                  <span className="font-medium text-foreground">{formatDuration(member.workedMinutes)}</span>
                </span>
              </div>
            )}

            {status === "on_break" && member.activeBreak && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Timer className="size-3 shrink-0" />
                <span>
                  {member.activeBreak.breakType.charAt(0) +
                    member.activeBreak.breakType.slice(1).toLowerCase().replace(/_/g, " ")}{" "}
                  since{" "}
                  <span className="font-medium text-foreground">
                    {formatTime(member.activeBreak.startTime)}
                  </span>
                </span>
                {typeof member.activeBreak.durationMinutes === "number" && (
                  <Badge
                    variant="outline"
                    className="h-4 px-1 text-[10px] border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                  >
                    {formatDuration(member.activeBreak.durationMinutes)}
                  </Badge>
                )}
              </div>
            )}

            {status === "on_leave" && member.leave?.leaveType && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Plane className="size-3 shrink-0" />
                <span className="font-medium text-foreground">{member.leave.leaveType.name}</span>
              </div>
            )}

            {status === "absent" && (
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

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["attendance", "manager", "team", "presence"],
    queryFn: getTeamPresence,
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60_000,
  });

  const membersWithStatus = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map((m) => ({ ...m, status: resolveStatus(m) }));
  }, [data]);

  const counts = useMemo(
    () =>
      membersWithStatus.reduce(
        (acc, m) => {
          acc[m.status]++;
          return acc;
        },
        { present: 0, on_break: 0, on_leave: 0, absent: 0 } as Record<PresenceStatus, number>,
      ),
    [membersWithStatus],
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["attendance", "manager", "team", "presence"],
    });
  };

  if (isLoading) {
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

  if (!membersWithStatus.length) {
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

  const total = membersWithStatus.length;
  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const grouped = [
    ...membersWithStatus.filter((m) => m.status === "present"),
    ...membersWithStatus.filter((m) => m.status === "on_break"),
    ...membersWithStatus.filter((m) => m.status === "on_leave"),
    ...membersWithStatus.filter((m) => m.status === "absent"),
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
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
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

      {/* Break status banner */}
      <BreakStatusBanner members={grouped} />

      {/* Member cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {grouped.map((member) => (
          <MemberCard key={member.employeeId} member={member} status={member.status} />
        ))}
      </div>
    </div>
  );
}
