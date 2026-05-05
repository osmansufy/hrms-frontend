// cspell:ignore tabular-nums
"use client";

import { useSession } from "@/components/auth/session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useMonthlyLateCount,
  useMyAttendanceRecords,
  useSignIn,
  useSignOut,
  useTodayAttendance,
  useMyBreaks,
  useMyMonthlyAttendanceSummary,
} from "@/lib/queries/attendance";
import { useUserBalances } from "@/lib/queries/leave";
import { useMyEmployeeProfile } from "@/lib/queries/employees";
import { useSystemSettings } from "@/lib/queries/system-settings";
import { useMyUserMeta } from "@/lib/queries/user-meta";
import { cn, toLocalDateStr, toStartOfDayISO, toEndOfDayISO } from "@/lib/utils";
import { useTimezoneFormatters } from "@/lib/hooks/use-timezone-formatters";
import { detectDevice, isDeviceAllowedForAttendance } from "@/lib/utils/device-detection";
import { Coffee, History, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AttendanceCard } from "./components/attendance-card";
import { AttendanceCharts } from "./components/attendance-charts";
import { BreakTracker } from "./attendance/components/break-tracker";
import { BreakHistoryCard } from "./attendance/components/break-history-card";
import { useActiveBreak } from "@/lib/queries/attendance";
import { getBreakTypeLabel, getBreakTypeIcon } from "@/lib/api/attendance";
import type { ExtendedAttendanceRecord, AttendanceBreak } from "@/lib/api/attendance";
import type { LeaveRecord } from "@/lib/api/leave";
import { LateAttendanceConfirmationModal } from "./components/late-attendance-confirmation-modal";
import { LateAttendanceWarningModal } from "./components/late-attendance-warning-modal";
import { useGeolocation } from "./hooks/use-geolocation";
import { buildAttendancePayload, getGeolocationForAttendance } from "./utils/attendance-handlers";
import { format, parseISO } from "date-fns";

function formatWorkedTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatHM(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}

/* ─── Now Strip ───────────────────────────────────────────────────── */
function NowStrip({
  state,
  workedSeconds,
  breakElapsedMinutes,
  totalBreakMinutes,
  signedInAt,
  onSignIn,
  onSignOut,
  name,
  role,
  isSignInDisabled,
  isSignOutDisabled,
  activeBreak,
}: {
  state: "out" | "in" | "break";
  workedSeconds: number;
  breakElapsedMinutes: number;
  totalBreakMinutes: number;
  signedInAt: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  name: string;
  role: string;
  isSignInDisabled: boolean;
  isSignOutDisabled: boolean;
  activeBreak: AttendanceBreak | null | undefined;
}) {
  const pillLabel = state === "out" ? "Not signed in" : state === "break" ? "On break" : "Working";
  const pillColor =
    state === "out"
      ? "text-muted-foreground border-border bg-secondary"
      : state === "break"
        ? "text-orange-700 border-orange-200 bg-orange-50 dark:text-orange-300 dark:border-orange-800 dark:bg-orange-900/20"
        : "text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-300 dark:border-emerald-800 dark:bg-emerald-900/20";
  const dotColor =
    state === "out"
      ? "bg-muted-foreground"
      : state === "break"
        ? "bg-orange-500"
        : "bg-emerald-500";

  const formattedSignIn = signedInAt
    ? (() => {
        try {
          return format(parseISO(signedInAt), "HH:mm");
        } catch {
          return "—";
        }
      })()
    : "—";

  return (
    <div className="border-border bg-card overflow-hidden rounded-[14px] border shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        {/* State cell */}
        <div className="border-border flex flex-col gap-2 border-b bg-emerald-500/[0.04] px-5 py-4 sm:border-r sm:border-b-0 dark:bg-emerald-500/[0.06]">
          <span
            className={`inline-flex items-center gap-1.5 self-start rounded border px-2 py-1 text-[10px] font-semibold tracking-[.10em] uppercase ${pillColor}`}
          >
            <span
              className={`inline-block size-1.5 rounded-full ${dotColor} ${state !== "out" ? "animate-pulse" : ""}`}
            />
            {pillLabel}
          </span>
          <div className="text-lg leading-tight font-semibold tracking-tight">{name}</div>
          <div className="text-muted-foreground text-[11px]">{role}</div>
        </div>

        {/* Work today */}
        <div className="border-border flex flex-col gap-1 border-b px-5 py-4 sm:border-r sm:border-b-0">
          <div className="text-muted-foreground text-[10px] font-semibold tracking-[.10em] uppercase">
            Work today
          </div>
          <div className="font-mono text-[22px] leading-none font-semibold tracking-tight tabular-nums">
            {state === "out" ? "00:00:00" : formatWorkedTime(workedSeconds)}
          </div>
          <div className="text-muted-foreground text-[11px]">Target 08:00:00</div>
        </div>

        {/* Break */}
        <div className="border-border flex flex-col gap-1 border-b px-5 py-4 sm:border-r sm:border-b-0">
          <div className="text-muted-foreground text-[10px] font-semibold tracking-[.10em] uppercase">
            Break
          </div>
          <div
            className={`font-mono text-[22px] leading-none font-semibold tracking-tight tabular-nums ${
              state === "break" ? "text-orange-600 dark:text-orange-400" : ""
            }`}
          >
            {state === "out"
              ? "—"
              : state === "break"
                ? formatHM(breakElapsedMinutes)
                : formatHM(totalBreakMinutes)}
          </div>
          <div className="text-muted-foreground text-[11px]">
            {state === "break"
              ? activeBreak
                ? `${getBreakTypeLabel(activeBreak.breakType)} · started ${format(parseISO(activeBreak.startTime), "HH:mm")}`
                : "In progress"
              : totalBreakMinutes > 0
                ? `${totalBreakMinutes}m taken today`
                : "No breaks yet"}
          </div>
        </div>

        {/* Signed in */}
        <div className="border-border flex flex-col gap-1 border-b px-5 py-4 sm:border-r sm:border-b-0">
          <div className="text-muted-foreground text-[10px] font-semibold tracking-[.10em] uppercase">
            Signed in
          </div>
          <div className="font-mono text-[22px] leading-none font-semibold tracking-tight tabular-nums">
            {formattedSignIn}
          </div>
          <div className="text-muted-foreground text-[11px]">
            {signedInAt ? "Today" : "Not yet signed in"}
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-center px-5 py-4">
          {state === "out" && (
            <Button
              onClick={onSignIn}
              disabled={isSignInDisabled}
              className="gap-1.5 rounded-full bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700"
            >
              <LogIn size={14} /> Sign In
            </Button>
          )}
          {(state === "in" || state === "break") && (
            <Button
              onClick={onSignOut}
              disabled={isSignOutDisabled}
              className="gap-1.5 rounded-full bg-red-600 px-5 font-semibold text-white hover:bg-red-700"
            >
              <LogOut size={14} /> Sign Out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── KPI strip ───────────────────────────────────────────────────── */
function KpiStrip({
  hoursWorked,
  targetHours,
  punctualityPct,
  lateCount,
  leaveBalance,
  isLoading,
}: {
  hoursWorked: number;
  targetHours: number;
  punctualityPct: number;
  lateCount: number;
  leaveBalance: number;
  isLoading?: boolean;
}) {
  const items = [
    {
      label: "This Month",
      value: `${hoursWorked.toFixed(1)}h`,
      foot: `of ${targetHours}h target`,
      delta: hoursWorked >= targetHours ? 1 : -1,
    },
    {
      label: "Punctuality",
      value: `${punctualityPct}%`,
      foot: "on-time arrivals",
      delta: punctualityPct >= 90 ? 1 : -1,
    },
    {
      label: "Late count",
      value: lateCount.toString(),
      foot: "late arrivals this month",
      delta: lateCount === 0 ? 1 : -1,
    },
    {
      label: "Leave balance",
      value: `${leaveBalance}d`,
      foot: "days available",
      delta: null,
    },
  ];

  return (
    <div className="divide-border border-border bg-card grid grid-cols-2 divide-x-0 divide-y overflow-hidden rounded-[14px] border shadow-sm lg:grid-cols-4 lg:divide-x lg:divide-y-0">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1 px-5 py-4">
          <div className="text-muted-foreground text-[10px] font-semibold tracking-[.10em] uppercase">
            {item.label}
          </div>
          <div className="font-mono text-[32px] leading-none font-semibold tracking-tight tabular-nums">
            {isLoading ? "—" : item.value}
          </div>
          <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[11px]">
            {item.delta !== null && (
              <span
                className={
                  item.delta > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }
              >
                {item.delta > 0 ? "▲" : "▼"}
              </span>
            )}
            {item.foot}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main dashboard ──────────────────────────────────────────────── */
export default function EmployeeDashboard() {
  const { session } = useSession();
  const userId = session?.user.id;
  const { formatDate } = useTimezoneFormatters();

  const { data: systemSettings } = useSystemSettings();
  const { data: userMeta } = useMyUserMeta();
  const { data: employeeProfile } = useMyEmployeeProfile();
  const leaveDeductionDay = systemSettings?.leaveDeductionDay ?? 4;
  const allowMobileAttendance = systemSettings?.allowMobileAttendance ?? false;
  const captureEmployeeLocation = systemSettings?.captureEmployeeLocation ?? true;

  const { data: monthlyLateCountData } = useMonthlyLateCount(userId);
  const monthlyLateCount = monthlyLateCountData?.lateCount ?? 0;

  const now = useMemo(() => new Date(), []);
  const { data: monthlySummary, isLoading: summaryLoading } = useMyMonthlyAttendanceSummary({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const { data: leaveBalances } = useUserBalances();

  const totalLeaveAvailable = useMemo(
    () => (leaveBalances ?? []).reduce((sum, b) => sum + Math.max(0, b.available), 0),
    [leaveBalances],
  );

  const hoursWorked = monthlySummary?.totalHoursWorked ?? 0;
  const workingDays = monthlySummary?.totalWorkingDays ?? 22;
  const targetHours = workingDays * 8;
  const presentDays = monthlySummary?.totalPresentDays ?? 0;
  const lateDays = monthlySummary?.totalLateDays ?? 0;
  const punctualityPct =
    presentDays > 0 ? Math.round(((presentDays - lateDays) / presentDays) * 100) : 100;

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const getWarningModalKey = useCallback(() => {
    if (!userId) return null;
    const n = new Date();
    return `late-attendance-warning-shown-${userId}-${n.getFullYear()}-${n.getMonth()}`;
  }, [userId]);

  const hasWarningBeenShown = useMemo(() => {
    const key = getWarningModalKey();
    if (!key) return false;
    return localStorage.getItem(key) === "true";
  }, [getWarningModalKey]);

  const { chartDays, chartQueryParams } = useMemo(() => {
    const days: string[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(toLocalDateStr(d));
    }
    return {
      chartDays: days,
      chartQueryParams: {
        startDate: toStartOfDayISO(days[0]),
        endDate: toEndOfDayISO(days[days.length - 1]),
        limit: "7",
      },
    };
  }, []);

  const { data: attendanceChartData } = useMyAttendanceRecords(userId, chartQueryParams);
  const attendanceBarData = useMemo(
    () =>
      chartDays.map((dayStr) => {
        const dateStr = formatDate(dayStr, "short");
        const rec = attendanceChartData?.data?.find((r: ExtendedAttendanceRecord) => {
          return toLocalDateStr(new Date(r.date)) === dayStr;
        });
        return {
          date: dateStr,
          present: rec?.signIn ? 1 : 0,
          late: rec?.isLate ? 1 : 0,
          absent: rec?.signIn ? 0 : 1,
        };
      }),
    [chartDays, attendanceChartData?.data, formatDate],
  );

  const [location, setLocation] = useState("");

  const {
    geolocationError,
    geolocationStatus,
    isGettingLocation,
    locationPermissionStatus,
    isLocationReady,
    isLocationBlocked,
    geolocationRef,
    getCurrentLocation,
    requestLocationAccess,
    waitForGeolocation,
    setGeolocationError,
  } = useGeolocation(captureEmployeeLocation);

  const [deviceInfo, setDeviceInfo] = useState<ReturnType<typeof detectDevice> | null>(null);
  const [isDeviceAllowed, setIsDeviceAllowed] = useState(true);

  useEffect(() => {
    const device = detectDevice();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeviceInfo(device);
    if (device.type === "mobile") {
      setIsDeviceAllowed(allowMobileAttendance || userMeta?.allowMobileSignIn !== false);
    } else {
      setIsDeviceAllowed(true);
    }
  }, [allowMobileAttendance, userMeta?.allowMobileSignIn]);

  const {
    data: todayAttendance,
    isLoading: attendanceLoading,
    isFetching: attendanceFetching,
  } = useTodayAttendance(userId);
  const signInMutation = useSignIn(userId);
  const signOutMutation = useSignOut(userId);

  const performSignIn = useCallback(async () => {
    if (!isDeviceAllowed) {
      const device = detectDevice();
      const message =
        allowMobileAttendance && userMeta?.allowMobileSignIn === false
          ? "Your account is not allowed to mark attendance from mobile devices."
          : device.type === "mobile"
            ? "Attendance is only allowed from desktop or laptop computers."
            : "Device not allowed";
      toast.error(message);
      return;
    }
    if (captureEmployeeLocation && locationPermissionStatus !== "granted") {
      toast.error(
        "Location access is required. Please grant location permission to mark attendance.",
      );
      return;
    }
    const geoData = await getGeolocationForAttendance(
      captureEmployeeLocation,
      getCurrentLocation,
      waitForGeolocation,
      geolocationRef,
      false,
    );
    if (!geoData && captureEmployeeLocation) {
      toast.error(
        "Unable to get your location. Please ensure location access is enabled and try again.",
      );
      return;
    }
    const payload = await buildAttendancePayload(location, geoData);
    try {
      const result = await signInMutation.mutateAsync(payload);
      toast.success("Signed in successfully");
      setLocation("");
      setGeolocationError(null);
      if ((result as { leaveDeducted?: boolean })?.leaveDeducted) {
        setShowConfirmationModal(true);
        toast.info("1 day of casual leave has been deducted for late attendance");
      }
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
        code?: string;
      };
      if (
        e?.response?.status === 403 ||
        e?.message?.includes("desktop") ||
        e?.message?.includes("laptop")
      ) {
        toast.error(
          e?.response?.data?.message ||
            "Attendance is only allowed from desktop or laptop computers.",
        );
      } else if (e?.code === "ERR_NETWORK" || e?.message?.includes("Network Error")) {
        toast.error("Network error: Please check if the backend server is running and accessible.");
      } else if (e?.response?.data?.message) {
        toast.error(e.response.data.message);
      } else {
        toast.error(e?.message || "Sign-in failed. Please try again.");
      }
    }
  }, [
    isDeviceAllowed,
    allowMobileAttendance,
    userMeta?.allowMobileSignIn,
    signInMutation,
    location,
    captureEmployeeLocation,
    locationPermissionStatus,
    getCurrentLocation,
    waitForGeolocation,
    geolocationRef,
    setGeolocationError,
  ]);

  const { data: activeBreakResponse } = useActiveBreak();
  const activeBreak = activeBreakResponse?.activeBreak;
  const [breakElapsedMinutes, setBreakElapsedMinutes] = useState(0);

  const today = useMemo(() => toLocalDateStr(new Date()), []);
  const { data: todayBreaksData } = useMyBreaks({ startDate: today, endDate: today });

  const totalBreakMinutes = useMemo(() => {
    let total = 0;
    const breaks = todayBreaksData?.data;
    if (breaks) {
      breaks.forEach((b: AttendanceBreak) => {
        if (b.endTime) {
          const start = new Date(b.startTime).getTime();
          const end = new Date(b.endTime).getTime();
          total += Math.floor((end - start) / 60000);
        }
      });
    }
    return total;
  }, [todayBreaksData]);

  const [workedSeconds, setWorkedSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    const calculateBreakSeconds = () => {
      let total = 0;
      if (todayBreaksData?.data) {
        todayBreaksData.data.forEach((b: AttendanceBreak) => {
          if (b.endTime) {
            total += Math.floor(
              (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 1000,
            );
          }
        });
      }
      if (activeBreak?.startTime) {
        total += Math.floor((Date.now() - new Date(activeBreak.startTime).getTime()) / 1000);
      }
      return total;
    };
    if (todayAttendance?.signIn && !todayAttendance?.signOut) {
      const signIn = new Date(todayAttendance.signIn);
      interval = setInterval(() => {
        setWorkedSeconds(
          Math.max(0, Math.floor((Date.now() - signIn.getTime()) / 1000) - calculateBreakSeconds()),
        );
      }, 1000);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWorkedSeconds(
        Math.max(0, Math.floor((Date.now() - signIn.getTime()) / 1000) - calculateBreakSeconds()),
      );
    } else if (todayAttendance?.signIn && todayAttendance?.signOut) {
      const total = Math.floor(
        (new Date(todayAttendance.signOut).getTime() - new Date(todayAttendance.signIn).getTime()) /
          1000,
      );
      setWorkedSeconds(Math.max(0, total - calculateBreakSeconds()));
    } else {
      setWorkedSeconds(0);
    }
    return () => interval && clearInterval(interval);
  }, [
    todayAttendance?.signIn,
    todayAttendance?.signOut,
    todayBreaksData?.data,
    activeBreak?.startTime,
  ]);

  useEffect(() => {
    if (!activeBreak?.startTime) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBreakElapsedMinutes(0);
      return;
    }
    const update = () =>
      setBreakElapsedMinutes(
        Math.floor((Date.now() - new Date(activeBreak.startTime).getTime()) / 60000),
      );
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [activeBreak?.startTime]);

  const handleSignIn = useCallback(async () => {
    if (monthlyLateCount === leaveDeductionDay - 1 && !hasWarningBeenShown) {
      setShowWarningModal(true);
      const key = getWarningModalKey();
      if (key) localStorage.setItem(key, "true");
      return;
    }
    await performSignIn();
  }, [monthlyLateCount, leaveDeductionDay, hasWarningBeenShown, getWarningModalKey, performSignIn]);

  const handleWarningModalConfirm = useCallback(() => {
    setShowWarningModal(false);
    performSignIn();
  }, [performSignIn]);

  const handleSignOut = useCallback(async () => {
    if (!isDeviceAllowed) {
      const message =
        allowMobileAttendance && userMeta?.allowMobileSignIn === false
          ? "Your account is not allowed to mark attendance from mobile devices."
          : deviceInfo?.type === "mobile"
            ? "Attendance is only allowed from desktop or laptop computers."
            : "Device not allowed";
      toast.error(message);
      return;
    }
    if (captureEmployeeLocation && locationPermissionStatus !== "granted") {
      toast.error(
        "Location access is required. Please grant location permission to mark attendance.",
      );
      return;
    }
    const geoData = await getGeolocationForAttendance(
      captureEmployeeLocation,
      getCurrentLocation,
      waitForGeolocation,
      geolocationRef,
      true,
    );
    if (!geoData && captureEmployeeLocation) {
      toast.error(
        "Unable to get your location. Please ensure location access is enabled and try again.",
      );
      return;
    }
    const payload = await buildAttendancePayload(location, geoData, { includeTimezone: false });
    try {
      await signOutMutation.mutateAsync(payload);
      toast.success("Signed out successfully");
      setLocation("");
      setGeolocationError(null);
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
        code?: string;
      };
      if (
        e?.response?.status === 403 ||
        e?.message?.includes("desktop") ||
        e?.message?.includes("laptop")
      ) {
        toast.error(
          e?.response?.data?.message ||
            "Attendance is only allowed from desktop or laptop computers.",
        );
      } else if (e?.code === "ERR_NETWORK" || e?.message?.includes("Network Error")) {
        toast.error("Network error: Please check if the backend server is running and accessible.");
      } else if (e?.response?.data?.message) {
        toast.error(e.response.data.message);
      } else {
        toast.error(e?.message || "Sign-out failed. Please try again.");
      }
    }
  }, [
    isDeviceAllowed,
    allowMobileAttendance,
    userMeta?.allowMobileSignIn,
    deviceInfo,
    signOutMutation,
    location,
    captureEmployeeLocation,
    locationPermissionStatus,
    getCurrentLocation,
    waitForGeolocation,
    geolocationRef,
    setGeolocationError,
  ]);

  const hasSignedInToday = Boolean(todayAttendance?.signIn);
  const hasSignedOut = Boolean(todayAttendance?.signOut);
  const isOnBreak = Boolean(activeBreak) && hasSignedInToday;

  const nowState: "out" | "in" | "break" = !hasSignedInToday ? "out" : isOnBreak ? "break" : "in";

  const isSignInDisabled =
    attendanceLoading ||
    signInMutation.isPending ||
    hasSignedInToday ||
    !isDeviceAllowed ||
    (captureEmployeeLocation && !isLocationReady) ||
    isOnBreak;

  const isSignOutDisabled =
    attendanceLoading ||
    signOutMutation.isPending ||
    hasSignedOut ||
    !isDeviceAllowed ||
    (captureEmployeeLocation && !isLocationReady) ||
    isOnBreak;

  const employeeName = employeeProfile
    ? `${employeeProfile.firstName} ${employeeProfile.lastName}`
    : (session?.user?.name ?? "You");

  const employeeRole =
    (employeeProfile as { designation?: { name?: string } } | null | undefined)?.designation
      ?.name ??
    session?.user?.roles?.[0]
      ?.replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()) ??
    "Employee";

  return (
    <div className="container space-y-5 pb-12">
      {/* ─── Page header ──────────────────────────────────────────── */}
      <div>
        <div className="text-muted-foreground mb-1.5 flex items-center gap-2 text-[10px] font-semibold tracking-[.12em] uppercase">
          <span className="h-px w-3.5 bg-emerald-600 dark:bg-emerald-400" />
          Welcome back · {format(new Date(), "EEEE, MMMM d")}
        </div>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl leading-none font-semibold tracking-tight">
              Good{" "}
              {new Date().getHours() < 12
                ? "morning"
                : new Date().getHours() < 17
                  ? "afternoon"
                  : "evening"}
              , {employeeProfile?.firstName ?? session?.user?.name?.split(" ")[0] ?? "there"}.
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/dashboard/employee/leave">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                Request leave
              </Button>
            </Link>
            {hasSignedInToday && (
              <Link href="/dashboard/employee/attendance/reconciliation">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  Reconcile
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ─── Now Strip ────────────────────────────────────────────── */}
      <NowStrip
        state={nowState}
        workedSeconds={workedSeconds}
        breakElapsedMinutes={breakElapsedMinutes}
        totalBreakMinutes={totalBreakMinutes}
        signedInAt={todayAttendance?.signIn ?? null}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        name={employeeName}
        role={employeeRole}
        isSignInDisabled={isSignInDisabled}
        isSignOutDisabled={isSignOutDisabled}
        activeBreak={activeBreak}
      />

      {/* ─── KPI strip ────────────────────────────────────────────── */}
      <KpiStrip
        hoursWorked={hoursWorked}
        targetHours={targetHours}
        punctualityPct={punctualityPct}
        lateCount={monthlyLateCount}
        leaveBalance={totalLeaveAvailable}
        isLoading={summaryLoading}
      />

      {/* ─── Attendance & Breaks section ─────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">Attendance &amp; Breaks</h2>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <AttendanceCard
          todayAttendance={todayAttendance}
          attendanceLoading={attendanceLoading}
          attendanceFetching={attendanceFetching}
          signInMutation={signInMutation}
          signOutMutation={signOutMutation}
          captureEmployeeLocation={captureEmployeeLocation}
          deviceInfo={deviceInfo}
          isDeviceAllowed={isDeviceAllowed}
          geolocationStatus={geolocationStatus}
          geolocationError={geolocationError}
          locationPermissionStatus={locationPermissionStatus}
          isGettingLocation={isGettingLocation}
          isLocationReady={isLocationReady}
          isLocationBlocked={isLocationBlocked}
          activeBreak={activeBreak}
          onRequestLocationAccess={requestLocationAccess}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          location={location}
          onLocationChange={setLocation}
        />

        {hasSignedInToday ? (
          <BreakTracker />
        ) : (
          <Card className="border-muted-foreground/20 flex min-h-70 flex-col items-center justify-center border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="bg-muted mb-4 rounded-full p-4">
                <Coffee className="text-muted-foreground/50 h-8 w-8" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Break Tracker</p>
              <p className="text-muted-foreground/70 mt-1 max-w-50 text-xs">
                Sign in first to start tracking your breaks.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <AttendanceCharts attendanceBarData={attendanceBarData} />

        {hasSignedInToday ? (
          <BreakHistoryCard />
        ) : (
          <Card className="border-muted-foreground/20 flex min-h-70 flex-col items-center justify-center border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="bg-muted mb-4 rounded-full p-4">
                <History className="text-muted-foreground/50 h-8 w-8" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Break History</p>
              <p className="text-muted-foreground/70 mt-1 max-w-50 text-xs">
                Your break history for today will appear here after you sign in.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <LateAttendanceWarningModal
        open={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleWarningModalConfirm}
        lateCount={monthlyLateCount}
      />
      <LateAttendanceConfirmationModal
        open={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        lateCount={monthlyLateCount}
      />
    </div>
  );
}
