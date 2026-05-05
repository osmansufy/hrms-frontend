"use client";

import { useState, useMemo } from "react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  Check,
  X,
  Download,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Users,
  UserCheck,
  Calendar,
  UserX,
  Clock,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/components/auth/session-provider";
import { useAttendanceStats, useAttendanceRecords } from "@/lib/queries/attendance";
import {
  usePendingHRApprovals,
  useAllEmployeeLeaves,
  useApproveLeave,
  useRejectLeave,
} from "@/lib/queries/leave";
import { useEmployees } from "@/lib/queries/employees";
import { useDepartments } from "@/lib/queries/departments";
import { toLocalDateStr, toStartOfDayISO, toEndOfDayISO } from "@/lib/utils";
import { toast } from "sonner";
import type { ExtendedAttendanceRecord } from "@/lib/api/attendance";
import type { LeaveRecord } from "@/lib/api/leave";
import type { Department } from "@/lib/api/departments";

/* ─── Tiny SVG charts ─────────────────────────────────────────── */
function LineChartSvg({
  series,
  height = 160,
}: {
  series: { color: string; data: number[]; dash?: string }[];
  height?: number;
}) {
  const w = 520,
    h = height,
    pad = { l: 28, r: 8, t: 10, b: 20 };
  const all = series.flatMap((s) => s.data);
  const max = Math.max(...all) * 1.1 || 1;
  const n = series[0].data.length;
  const xstep = (w - pad.l - pad.r) / Math.max(n - 1, 1);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line
          key={i}
          x1={pad.l}
          x2={w - pad.r}
          y1={pad.t + (h - pad.t - pad.b) * t}
          y2={pad.t + (h - pad.t - pad.b) * t}
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="2 3"
          className="text-border opacity-60"
        />
      ))}
      {series.map((s, si) => {
        const path = s.data
          .map((v, i) => {
            const x = pad.l + i * xstep;
            const y = pad.t + (1 - v / max) * (h - pad.t - pad.b);
            return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(" ");
        return (
          <g key={si}>
            <path
              d={path}
              stroke={s.color}
              strokeWidth="1.75"
              fill="none"
              strokeDasharray={s.dash ?? ""}
            />
            {s.data.map((v, i) => (
              <circle
                key={i}
                cx={pad.l + i * xstep}
                cy={pad.t + (1 - v / max) * (h - pad.t - pad.b)}
                r="2.5"
                fill={s.color}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function StackedBarSvg({
  data,
  keys,
  colors,
  height = 160,
}: {
  data: Record<string, number | string>[];
  keys: string[];
  colors: string[];
  height?: number;
}) {
  const w = 520,
    h = height,
    pad = { l: 28, r: 8, t: 10, b: 20 };
  const max =
    Math.max(...data.map((d) => keys.reduce((a, k) => a + (Number(d[k]) || 0), 0))) * 1.15 || 1;
  const bw = (w - pad.l - pad.r) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }}>
      {[0, 0.5, 1].map((t, i) => (
        <line
          key={i}
          x1={pad.l}
          x2={w - pad.r}
          y1={pad.t + (h - pad.t - pad.b) * t}
          y2={pad.t + (h - pad.t - pad.b) * t}
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="2 3"
          className="text-border opacity-60"
        />
      ))}
      {data.map((d, i) => {
        const x = pad.l + i * bw + bw * 0.18;
        const bw2 = bw * 0.64;
        let acc = 0;
        return (
          <g key={i}>
            {keys.map((k, ki) => {
              const v = Number(d[k]) || 0;
              const bh = (v / max) * (h - pad.t - pad.b);
              const y = h - pad.b - acc - bh;
              acc += bh;
              return (
                <rect
                  key={k}
                  x={x}
                  y={y}
                  width={bw2}
                  height={bh}
                  fill={colors[ki]}
                  rx={ki === keys.length - 1 ? 2 : 0}
                />
              );
            })}
            <text
              x={x + bw2 / 2}
              y={h - pad.b + 14}
              textAnchor="middle"
              fontSize={10}
              className="fill-muted-foreground"
              fontFamily="var(--font-mono, monospace)"
            >
              {String(d.l)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutSvg({
  slices,
  total,
  label,
  size = 140,
}: {
  slices: { v: number; color: string }[];
  total: number;
  label: string;
  size?: number;
}) {
  const r = size * 0.44;
  const c = 2 * Math.PI * r;
  const sum = slices.reduce((a, s) => a + s.v, 0);
  const lengths = slices.map((s) => (sum ? (s.v / sum) * c : 0));
  const offsets = lengths.reduce<number[]>((acc, len, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + lengths[i - 1]);
    return acc;
  }, []);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--border)"
          strokeWidth="12"
          fill="none"
        />
        {slices.map((s, i) => {
          const len = lengths[i];
          const dasharray = `${len} ${c - len}`;
          const dashoffset = -offsets[i];
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={s.color}
              strokeWidth="12"
              fill="none"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {total}
        </div>
        <div
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: ".10em",
            color: "var(--muted-foreground)",
            marginTop: 3,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

/* ─── Status badge helpers ─────────────────────────────────────── */
function AttBadge({ record }: { record: ExtendedAttendanceRecord }) {
  if (!record.signIn && record.isOnLeave)
    return (
      <Badge className="gap-1 border-blue-200 bg-blue-500/10 text-[10px] text-blue-700 dark:border-blue-800 dark:text-blue-300">
        <span className="inline-block size-1.5 rounded-full bg-blue-500" />
        On Leave
      </Badge>
    );
  if (!record.signIn)
    return (
      <Badge className="gap-1 border-red-200 bg-red-500/10 text-[10px] text-red-700 dark:border-red-800 dark:text-red-300">
        <span className="inline-block size-1.5 rounded-full bg-red-500" />
        Absent
      </Badge>
    );
  if (record.isOnBreak)
    return (
      <Badge className="gap-1 border-orange-200 bg-orange-500/10 text-[10px] text-orange-700 dark:border-orange-800 dark:text-orange-300">
        <span className="inline-block size-1.5 rounded-full bg-orange-500" />
        On Break
      </Badge>
    );
  if (record.signOut)
    return (
      <Badge variant="secondary" className="gap-1 text-[10px]">
        Signed Out
      </Badge>
    );
  return (
    <Badge className="gap-1 border-emerald-200 bg-emerald-500/10 text-[10px] text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
      <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
      Present
    </Badge>
  );
}

function LeaveStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING:
      "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-300 dark:border-amber-800",
    PROCESSING:
      "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-800",
    APPROVED:
      "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-300 dark:border-emerald-800",
    REJECTED: "bg-red-500/10 text-red-700 border-red-200 dark:text-red-300 dark:border-red-800",
    CANCELLED: "bg-muted text-muted-foreground",
    HOLD: "bg-purple-500/10 text-purple-700 border-purple-200",
  };
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <Badge
      className={`gap-1 text-[10px] ${map[status] ?? "bg-secondary text-secondary-foreground"}`}
    >
      <span className="inline-block size-1.5 rounded-full" style={{ background: "currentColor" }} />
      {label}
    </Badge>
  );
}

function InitialsAvatar({ name, className = "" }: { name: string; className?: string }) {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  return (
    <span
      className={`bg-secondary border-border inline-flex shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${className}`}
      style={{ width: 28, height: 28 }}
    >
      {initials}
    </span>
  );
}

function StatCard({
  label,
  value,
  pct,
  color,
  bg,
  icon: Icon,
  isLoading,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
  bg: string;
  icon: React.ElementType;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-card border-border flex flex-col gap-2 rounded-[14px] border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[11px] font-medium">{label}</span>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ background: bg, color }}
        >
          <Icon size={13} />
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-2xl font-bold tracking-tight tabular-nums"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {isLoading ? "—" : value}
        </span>
        {pct < 100 && <span className="text-muted-foreground text-xs">{pct}%</span>}
      </div>
      <div className="bg-secondary mt-1 h-1 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/* ─── Mock trend data (no per-day history API) ──────────────────── */
const PULSE_SERIES = [
  { color: "var(--foreground)", data: [214, 221, 218, 225, 219, 228, 231, 226, 229, 232, 234] },
  { color: "#b45309", data: [12, 9, 11, 8, 14, 7, 9, 12, 8, 6, 5], dash: "4 3" },
];
const LEAVE_BARS = [
  { l: "W14", casual: 5, sick: 3, earned: 2 },
  { l: "W15", casual: 4, sick: 6, earned: 3 },
  { l: "W16", casual: 7, sick: 2, earned: 4 },
  { l: "W17", casual: 3, sick: 4, earned: 5 },
  { l: "W18", casual: 6, sick: 3, earned: 8 },
  { l: "W19", casual: 5, sick: 2, earned: 6 },
];

/* ─── Filter pill component ─────────────────────────────────────── */
function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-7 shrink-0 cursor-pointer rounded-full border px-3 text-[11px] font-medium transition-all ${
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { session } = useSession();
  const role = session?.user?.roles?.[0] ?? "admin";
  const today = toLocalDateStr(new Date());
  const todayLabel = format(new Date(), "EEEE, MMMM d");

  const [attFilter, setAttFilter] = useState("all");
  const [leaveTab, setLeaveTab] = useState("all");

  // Data queries
  const { data: stats, isLoading: statsLoading } = useAttendanceStats(today);
  const { data: attendanceData, refetch: refetchAtt } = useAttendanceRecords({
    startDate: toStartOfDayISO(today),
    endDate: toEndOfDayISO(today),
    limit: "50",
  });
  const { data: pendingLeaves } = usePendingHRApprovals(role);
  const { data: allLeavesData } = useAllEmployeeLeaves({ pageSize: 30 });
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();

  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();

  // Stats
  const totalActive = stats?.totalActive ?? 0;
  const present = stats?.present ?? 0;
  const late = stats?.late ?? 0;
  const onLeave = stats?.onLeave ?? 0;
  const absent = stats?.absent ?? 0;
  const presentPct = totalActive ? Math.round((present / totalActive) * 100) : 0;
  const latePct = totalActive ? Math.round((late / totalActive) * 100) : 0;
  const onLeavePct = totalActive ? Math.round((onLeave / totalActive) * 100) : 0;
  const absentPct = totalActive ? Math.round((absent / totalActive) * 100) : 0;

  const statCards = [
    {
      label: "Total Active",
      value: totalActive,
      pct: 100,
      color: "var(--foreground)",
      bg: "var(--secondary)",
      icon: Users,
    },
    {
      label: "Present",
      value: present,
      pct: presentPct,
      color: "#047857",
      bg: "rgba(16,185,129,.10)",
      icon: UserCheck,
    },
    {
      label: "Late",
      value: late,
      pct: latePct,
      color: "#b45309",
      bg: "rgba(245,158,11,.10)",
      icon: AlertTriangle,
    },
    {
      label: "On Leave",
      value: onLeave,
      pct: onLeavePct,
      color: "#1d4ed8",
      bg: "rgba(59,130,246,.10)",
      icon: Calendar,
    },
    {
      label: "Absent",
      value: absent,
      pct: absentPct,
      color: "#b91c1c",
      bg: "rgba(239,68,68,.10)",
      icon: UserX,
    },
  ];

  // Attendance table
  const attendanceRecords: ExtendedAttendanceRecord[] = attendanceData?.data ?? [];
  const filteredAtt = useMemo(() => {
    if (attFilter === "all") return attendanceRecords;
    if (attFilter === "present")
      return attendanceRecords.filter(
        (r) => r.signIn && !r.signOut && !r.isOnBreak && !r.isOnLeave,
      );
    if (attFilter === "late") return attendanceRecords.filter((r) => r.isLate);
    if (attFilter === "onBreak") return attendanceRecords.filter((r) => r.isOnBreak);
    if (attFilter === "onLeave") return attendanceRecords.filter((r) => r.isOnLeave);
    if (attFilter === "absent") return attendanceRecords.filter((r) => !r.signIn && !r.isOnLeave);
    if (attFilter === "signedOut") return attendanceRecords.filter((r) => !!r.signOut);
    return attendanceRecords;
  }, [attendanceRecords, attFilter]);

  // Leave queue
  const allLeaveRequests: LeaveRecord[] = useMemo(() => {
    const pending = pendingLeaves ?? [];
    const all = allLeavesData?.data ?? [];
    const pendingIds = new Set(pending.map((l) => l.id));
    const extra = all.filter((l) => !pendingIds.has(l.id));
    return [...pending, ...extra].slice(0, 20);
  }, [pendingLeaves, allLeavesData]);

  const filteredLeave = useMemo(() => {
    if (leaveTab === "all") return allLeaveRequests;
    if (leaveTab === "pending")
      return allLeaveRequests.filter((r) => r.status === "PENDING" || r.status === "PROCESSING");
    if (leaveTab === "approved") return allLeaveRequests.filter((r) => r.status === "APPROVED");
    if (leaveTab === "rejected") return allLeaveRequests.filter((r) => r.status === "REJECTED");
    return allLeaveRequests;
  }, [allLeaveRequests, leaveTab]);

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Leave approved");
    } catch {
      toast.error("Failed to approve leave");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMutation.mutateAsync(id);
      toast.success("Leave rejected");
    } catch {
      toast.error("Failed to reject leave");
    }
  };

  const pendingCount = pendingLeaves?.length ?? 0;
  const employeeCount = employees?.length ?? 0;
  const deptCount = departments?.length ?? 0;

  const formatTime = (iso: string | null) => {
    if (!iso) return "—";
    try {
      return format(parseISO(iso), "HH:mm");
    } catch {
      return "—";
    }
  };

  const getEmployeeName = (record: ExtendedAttendanceRecord) => {
    const emp = record.user?.employee as { firstName?: string; lastName?: string } | undefined;
    if (emp) {
      const { firstName, lastName } = emp;
      if (firstName || lastName) return `${firstName ?? ""} ${lastName ?? ""}`.trim();
    }
    return record.user?.email?.split("@")[0] ?? "—";
  };

  const getLeaveName = (leave: LeaveRecord) => {
    const emp = leave.user?.employee;
    if (emp) return `${emp.firstName} ${emp.lastName}`;
    return leave.user?.email?.split("@")[0] ?? "—";
  };

  return (
    <div className="container space-y-6 pb-12">
      {/* ─── Page Header ─────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="text-muted-foreground flex items-center gap-2 text-[10px] font-semibold tracking-[.12em] uppercase">
          <span className="h-px w-3.5 bg-amber-600 dark:bg-amber-400" />
          Operations · {todayLabel}
        </div>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl leading-none font-semibold tracking-tight">
              HR command center
            </h1>
            <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm">
              You have <strong className="text-foreground">{pendingCount} leave requests</strong>{" "}
              awaiting review and{" "}
              <strong className="text-foreground">{employeeCount} active employees</strong> across{" "}
              <strong className="text-foreground">{deptCount} departments</strong>.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download size={13} /> Export
            </Button>
            <Link href="/dashboard/admin/employees">
              <Button size="sm" className="gap-1.5 text-xs">
                <UserPlus size={13} /> Add Employee
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 5 Stat Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s, i) => (
          <StatCard key={i} {...s} isLoading={statsLoading} />
        ))}
      </div>

      {/* ─── Break Alert ─────────────────────────────────────────── */}
      {present > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5 dark:border-amber-800/40 dark:bg-amber-900/10">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <AlertTriangle size={15} className="text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-amber-900 dark:text-amber-200">
                Attendance data is live
              </div>
              <div className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                Today&apos;s records update in real time — refresh for the latest status.
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-amber-300 text-xs text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300"
            onClick={() => refetchAtt()}
          >
            <RefreshCw size={12} className="mr-1" /> Refresh
          </Button>
        </div>
      )}

      {/* ─── Attendance Table + Pulse Chart ──────────────────────── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Attendance table — spans 8 cols */}
        <div className="bg-card border-border flex flex-col overflow-hidden rounded-[14px] border shadow-sm xl:col-span-8">
          <div className="border-border flex items-center justify-between border-b px-4 py-3.5">
            <div>
              <h3 className="text-[13px] font-semibold">Today&apos;s Attendance</h3>
              <div className="text-muted-foreground mt-0.5 text-[11px]">
                Live view · {attendanceRecords.length} records
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => refetchAtt()}
              >
                <RefreshCw size={11} /> Refresh
              </Button>
            </div>
          </div>

          {/* Filter pills */}
          <div className="border-border flex gap-1.5 overflow-x-auto border-b px-4 py-2.5">
            {[
              ["all", "All"],
              ["present", "Present"],
              ["signedOut", "Signed Out"],
              ["late", "Late"],
              ["onBreak", "On Break"],
              ["onLeave", "On Leave"],
              ["absent", "Absent"],
            ].map(([k, l]) => (
              <FilterPill key={k} active={attFilter === k} onClick={() => setAttFilter(k)}>
                {l}
              </FilterPill>
            ))}
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["Employee", "In", "Out", "Status", "Location"].map((h) => (
                    <th
                      key={h}
                      className="text-muted-foreground border-border border-b px-3.5 py-2.5 text-left text-[10px] font-medium tracking-[.08em] uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAtt.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted-foreground px-3.5 py-8 text-center text-sm"
                    >
                      No records for this filter
                    </td>
                  </tr>
                ) : (
                  filteredAtt.slice(0, 12).map((r, i) => (
                    <tr key={r.id ?? i} className="hover:bg-secondary/50 transition-colors">
                      <td className="border-border border-b px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <InitialsAvatar name={getEmployeeName(r)} />
                          <div>
                            <div className="leading-tight font-medium">{getEmployeeName(r)}</div>
                            <div className="text-muted-foreground text-[11px]">
                              {(r.user?.employee as { department?: { name?: string } } | undefined)
                                ?.department?.name ??
                                r.user?.employee?.employeeCode ??
                                r.user?.email?.split("@")[0] ??
                                "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`border-border border-b px-3.5 py-2.5 font-mono text-[12px] tabular-nums ${
                          r.isLate ? "font-semibold text-amber-700 dark:text-amber-400" : ""
                        }`}
                      >
                        {formatTime(r.signIn)}
                      </td>
                      <td className="border-border text-muted-foreground border-b px-3.5 py-2.5 font-mono text-[12px] tabular-nums">
                        {formatTime(r.signOut)}
                      </td>
                      <td className="border-border border-b px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-1">
                          <AttBadge record={r} />
                          {r.isLate && (
                            <Badge className="gap-1 border-amber-200 bg-amber-500/10 text-[10px] text-amber-700 dark:border-amber-800 dark:text-amber-300">
                              Late
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="border-border text-muted-foreground border-b px-3.5 py-2.5 text-[11px]">
                        {r.signInAddress || r.signInLocation ? (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            {r.signInAddress ?? r.signInLocation}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-border flex items-center justify-between border-t px-4 py-3">
            <span className="text-muted-foreground text-[11px]">
              Showing {Math.min(filteredAtt.length, 12)} of {filteredAtt.length} records
            </span>
            <Link
              href="/dashboard/admin/attendance"
              className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline dark:text-amber-400"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        {/* Attendance pulse chart — spans 4 cols */}
        <div className="bg-card border-border flex flex-col rounded-[14px] border p-5 shadow-sm xl:col-span-4">
          <div className="mb-3">
            <div className="text-[13px] font-semibold">Attendance pulse</div>
            <div className="text-muted-foreground mt-0.5 text-[11px]">
              11-day trend · present vs late
            </div>
          </div>
          <LineChartSvg series={PULSE_SERIES} height={180} />
          <div className="mt-3 flex items-center justify-center gap-4">
            <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <span className="bg-foreground inline-block h-2.5 w-2.5 rounded-sm" /> Present
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-600" /> Late
            </span>
          </div>
          <div className="border-border mt-auto flex gap-4 border-t pt-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                Avg present
              </span>
              <span className="font-mono text-lg font-bold tabular-nums">{present || "—"}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                Today late
              </span>
              <span className="font-mono text-lg font-bold text-amber-700 tabular-nums dark:text-amber-400">
                {late || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Leave Queue + Leave Usage Chart ─────────────────────── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Leave queue — spans 8 cols */}
        <div className="bg-card border-border flex flex-col overflow-hidden rounded-[14px] border shadow-sm xl:col-span-8">
          <div className="border-border flex items-center justify-between border-b px-4 py-3.5">
            <div>
              <h3 className="text-[13px] font-semibold">Leave Requests</h3>
              <div className="text-muted-foreground mt-0.5 text-[11px]">
                Review pending requests and approve or reject
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/admin/leave?tab=approvals">
                <Button size="sm" className="h-7 text-xs">
                  Review All
                </Button>
              </Link>
            </div>
          </div>

          {/* Tab pills */}
          <div className="border-border flex gap-1.5 overflow-x-auto border-b px-4 py-2.5">
            {[
              ["all", "All"],
              ["pending", "Pending"],
              ["approved", "Approved"],
              ["rejected", "Rejected"],
            ].map(([k, l]) => (
              <FilterPill key={k} active={leaveTab === k} onClick={() => setLeaveTab(k)}>
                {l}
              </FilterPill>
            ))}
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["Employee", "Type", "Dates", "Days", "Status", "Applied", ""].map((h, i) => (
                    <th
                      key={i}
                      className={`text-muted-foreground border-border border-b px-3.5 py-2.5 text-left text-[10px] font-medium tracking-[.08em] uppercase ${
                        i === 3 ? "text-right" : ""
                      } ${i >= 5 ? "hidden sm:table-cell" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeave.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-muted-foreground px-3.5 py-8 text-center text-sm"
                    >
                      No leave requests for this filter
                    </td>
                  </tr>
                ) : (
                  filteredLeave.slice(0, 8).map((leave, i) => (
                    <tr key={leave.id ?? i} className="hover:bg-secondary/50 transition-colors">
                      <td className="border-border border-b px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <InitialsAvatar name={getLeaveName(leave)} />
                          <div>
                            <div className="leading-tight font-medium">{getLeaveName(leave)}</div>
                            <div className="text-muted-foreground text-[11px]">
                              {leave.user?.employee?.department?.name ?? "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="border-border border-b px-3.5 py-2.5 text-[12px]">
                        {leave.leaveType?.name ?? "—"}
                      </td>
                      <td className="border-border text-muted-foreground border-b px-3.5 py-2.5 font-mono text-[12px]">
                        {format(parseISO(leave.startDate), "MMM d")}
                        {leave.startDate !== leave.endDate && (
                          <> — {format(parseISO(leave.endDate), "MMM d")}</>
                        )}
                      </td>
                      <td className="border-border border-b px-3.5 py-2.5 text-right font-mono text-[12px]">
                        {leave.totalDays ?? 1}
                      </td>
                      <td className="border-border border-b px-3.5 py-2.5">
                        <LeaveStatusBadge status={leave.status} />
                      </td>
                      <td className="border-border text-muted-foreground hidden border-b px-3.5 py-2.5 text-[11px] sm:table-cell">
                        {formatDistanceToNow(parseISO(leave.createdAt), { addSuffix: true })}
                      </td>
                      <td className="border-border border-b px-3.5 py-2.5 text-right">
                        {(leave.status === "PENDING" || leave.status === "PROCESSING") && (
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              onClick={() => handleApprove(leave.id)}
                              disabled={approveMutation.isPending}
                              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-900/20"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleReject(leave.id)}
                              disabled={rejectMutation.isPending}
                              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-border flex items-center justify-between border-t px-4 py-3">
            <span className="text-muted-foreground text-[11px]">
              Showing {Math.min(filteredLeave.length, 8)} of {filteredLeave.length} requests
            </span>
            <Link
              href="/dashboard/admin/leave"
              className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline dark:text-amber-400"
            >
              Manage all <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        {/* Leave usage stacked bar — spans 4 cols */}
        <div className="bg-card border-border flex flex-col rounded-[14px] border p-5 shadow-sm xl:col-span-4">
          <div className="mb-3">
            <div className="text-[13px] font-semibold">Leave usage · 6 weeks</div>
            <div className="text-muted-foreground mt-0.5 text-[11px]">Across all departments</div>
          </div>
          <StackedBarSvg
            data={LEAVE_BARS}
            keys={["casual", "sick", "earned"]}
            colors={["#0ea5e9", "#f59e0b", "#10b981"]}
            height={160}
          />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            {[
              { color: "#0ea5e9", label: "Casual" },
              { color: "#f59e0b", label: "Sick" },
              { color: "#10b981", label: "Earned" },
            ].map((l) => (
              <span
                key={l.label}
                className="text-muted-foreground flex items-center gap-1.5 text-[11px]"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: l.color }}
                />
                {l.label}
              </span>
            ))}
          </div>
          <div className="border-border mt-auto border-t pt-3">
            <Link
              href="/dashboard/admin/leave"
              className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline dark:text-amber-400"
            >
              View leave analytics <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Dept Breakdown + Headcount ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Department breakdown */}
        <div className="bg-card border-border overflow-hidden rounded-[14px] border shadow-sm xl:col-span-8">
          <div className="border-border flex items-center justify-between border-b px-4 py-3.5">
            <div>
              <h3 className="text-[13px] font-semibold">Department overview</h3>
              <div className="text-muted-foreground mt-0.5 text-[11px]">
                {deptCount} departments · headcount summary
              </div>
            </div>
            <Link
              href="/dashboard/admin/departments"
              className="flex items-center gap-1 text-xs text-amber-700 hover:underline dark:text-amber-400"
            >
              Manage <ChevronRight size={11} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["Department", "Headcount", ""].map((h, i) => (
                    <th
                      key={i}
                      className="text-muted-foreground border-border border-b px-3.5 py-2.5 text-left text-[10px] font-medium tracking-[.08em] uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(departments ?? [])
                  .slice(0, 8)
                  .map(
                    (
                      dept: Department & {
                        _count?: { employees?: number };
                        employeeCount?: number;
                      },
                      i,
                    ) => (
                      <tr key={dept.id ?? i} className="hover:bg-secondary/50 transition-colors">
                        <td className="border-border border-b px-3.5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="bg-secondary flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                              <Building2 size={13} className="text-muted-foreground" />
                            </div>
                            <span className="font-medium">{dept.name}</span>
                          </div>
                        </td>
                        <td className="border-border border-b px-3.5 py-3 font-mono text-[12px] tabular-nums">
                          {dept._count?.employees ?? dept.employeeCount ?? "—"}
                        </td>
                        <td className="border-border w-40 border-b px-3.5 py-3">
                          <div className="bg-secondary h-1.5 overflow-hidden rounded-full">
                            <div
                              className="h-full rounded-full bg-amber-500/80 transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  ((dept._count?.employees ?? 0) / Math.max(employeeCount, 1)) *
                                    100,
                                  100,
                                )}%`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Headcount donut + quick links */}
        <div className="bg-card border-border flex flex-col gap-5 rounded-[14px] border p-5 shadow-sm xl:col-span-4">
          <div>
            <div className="text-[13px] font-semibold">Headcount</div>
            <div className="text-muted-foreground mt-0.5 text-[11px]">Total active workforce</div>
          </div>
          <div className="flex items-center justify-center">
            <DonutSvg
              slices={[
                { v: present, color: "#047857" },
                { v: late, color: "#b45309" },
                { v: onLeave, color: "#1d4ed8" },
                { v: absent, color: "#b91c1c" },
              ]}
              total={totalActive || employeeCount}
              label="Active"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Present", value: present, color: "#047857" },
              { label: "Late", value: late, color: "#b45309" },
              { label: "On Leave", value: onLeave, color: "#1d4ed8" },
              { label: "Absent", value: absent, color: "#b91c1c" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-[12px]">
                <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: s.color }} />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="ml-auto font-mono font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
          <div className="border-border mt-auto flex flex-col gap-2 border-t pt-4">
            <div className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-wider uppercase">
              Quick links
            </div>
            {[
              { label: "Employees", href: "/dashboard/admin/employees", icon: Users },
              { label: "Leave queue", href: "/dashboard/admin/leave", icon: Calendar },
              { label: "Attendance", href: "/dashboard/admin/attendance", icon: Clock },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2.5 text-[12px] font-medium transition-colors"
              >
                <l.icon size={13} />
                {l.label}
                <ArrowRight size={11} className="ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
