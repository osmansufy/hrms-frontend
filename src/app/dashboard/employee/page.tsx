"use client";

import { useSession } from "@/components/auth/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useMonthlyLateCount, useMyAttendanceRecords, useMyLostHoursReport, useSignIn,
  useSignOut,
  useTodayAttendance,
  useMyBreaks
} from "@/lib/queries/attendance";
import { useMyLeaves } from "@/lib/queries/leave";
import { useSystemSettings } from "@/lib/queries/system-settings";
import { useMyUserMeta } from "@/lib/queries/user-meta";
import { cn, toLocalDateStr, toStartOfDayISO, toEndOfDayISO } from "@/lib/utils";
import { useTimezoneFormatters } from "@/lib/hooks/use-timezone-formatters";
import {
  detectDevice,
  isDeviceAllowedForAttendance
} from "@/lib/utils/device-detection";
import { ClockAlert, Coffee, History } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AttendanceCard } from "./components/attendance-card";
import { AttendanceCharts } from "./components/attendance-charts";
import { EmployeeSummaryCard } from "./components/employee-summary-card";
import { BreakTracker } from "./attendance/components/break-tracker";
import { BreakHistoryCard } from "./attendance/components/break-history-card";
import { useActiveBreak } from "@/lib/queries/attendance";
import { getBreakTypeLabel, getBreakTypeIcon } from "@/lib/api/attendance";
import type {
  ExtendedAttendanceRecord,
  AttendanceBreak,
} from "@/lib/api/attendance";
import type { LeaveRecord } from "@/lib/api/leave";
import { LateAttendanceConfirmationModal } from "./components/late-attendance-confirmation-modal";
import { LateAttendanceWarningModal } from "./components/late-attendance-warning-modal";
import { useGeolocation } from "./hooks/use-geolocation";
import { buildAttendancePayload, getGeolocationForAttendance } from "./utils/attendance-handlers";



function formatWorkedTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function EmployeeDashboard() {

  // Session and userId
  const { session } = useSession();
  const userId = session?.user.id;
  const { formatDate } = useTimezoneFormatters();

  // System settings (late threshold, mobile attendance, location capture)
  const { data: systemSettings } = useSystemSettings();
  const { data: userMeta } = useMyUserMeta();
  const leaveDeductionDay = systemSettings?.leaveDeductionDay ?? 4;
  const allowMobileAttendance = systemSettings?.allowMobileAttendance ?? false;
  const captureEmployeeLocation =
    systemSettings?.captureEmployeeLocation ?? true;

  // Monthly late count
  const { data: monthlyLateCountData } = useMonthlyLateCount(userId);
  const monthlyLateCount = monthlyLateCountData?.lateCount ?? 0;

  // Modal states
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Check if warning modal has been shown for current month
  const getWarningModalKey = useCallback(() => {
    if (!userId) return null;
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${now.getMonth()}`;
    return `late-attendance-warning-shown-${userId}-${monthYear}`;
  }, [userId]);

  const hasWarningBeenShown = useMemo(() => {
    const key = getWarningModalKey();
    if (!key) return false;
    return localStorage.getItem(key) === "true";
  }, [getWarningModalKey]);

  // Attendance chart data for last 7 days — stable references, computed once on mount
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
  const { data: attendanceChartData } = useMyAttendanceRecords(
    userId,
    chartQueryParams,
  );
  const attendanceBarData = useMemo(() =>
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
    }), [chartDays, attendanceChartData?.data, formatDate]);

  // Location state
  const [location, setLocation] = useState("");

  // Geolocation hook - handles all geolocation logic
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
    setGeolocation,
  } = useGeolocation(captureEmployeeLocation);

  // Device detection for attendance restriction
  const [deviceInfo, setDeviceInfo] = useState<ReturnType<typeof detectDevice> | null>(null);
  const [isDeviceAllowed, setIsDeviceAllowed] = useState(true);

  useEffect(() => {
    const device = detectDevice();
    setDeviceInfo(device);
    if (device.type === "mobile") {
      // Mobile allowed only when system allows or user meta allows (no row = allow)
      setIsDeviceAllowed(allowMobileAttendance || userMeta?.allowMobileSignIn !== false);
    } else {
      setIsDeviceAllowed(true);
    }
  }, [allowMobileAttendance, userMeta?.allowMobileSignIn]);

  // Attendance queries
  const { data: todayAttendance, isLoading: attendanceLoading, isFetching: attendanceFetching } = useTodayAttendance(userId);
  const signInMutation = useSignIn(userId);
  const signOutMutation = useSignOut(userId);

  // Attendance handlers - using utility functions
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

    // Location permission check - block if required but not granted
    if (captureEmployeeLocation && locationPermissionStatus !== "granted") {
      toast.error("Location access is required. Please grant location permission to mark attendance.");
      return;
    }

    // Get geolocation (should be fast since watchPosition keeps it updated)
    const geoData = await getGeolocationForAttendance(
      captureEmployeeLocation,
      getCurrentLocation,
      waitForGeolocation,
      geolocationRef,
      false
    );

    // Final check - if still no location and it's required, block
    if (!geoData && captureEmployeeLocation) {
      toast.error("Unable to get your location. Please ensure location access is enabled and try again.");
      return;
    }

    const payload = await buildAttendancePayload(location, geoData);

    try {
      const result = await signInMutation.mutateAsync(payload);
      toast.success("Signed in successfully");
      setLocation("");
      setGeolocationError(null);

      if ((result as any)?.leaveDeducted) {
        setShowConfirmationModal(true);
        toast.info("1 day of casual leave has been deducted for late attendance");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      if (err?.response?.status === 403 || err?.message?.includes("desktop") || err?.message?.includes("laptop")) {
        toast.error(err?.response?.data?.message || "Attendance is only allowed from desktop or laptop computers.");
      } else if (err?.code === "ERR_NETWORK" || err?.message?.includes("Network Error")) {
        toast.error("Network error: Please check if the backend server is running and accessible.");
      } else if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(err?.message || "Sign-in failed. Please try again.");
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

  // Active break status
  const { data: activeBreakResponse } = useActiveBreak();
  const activeBreak = activeBreakResponse?.activeBreak;
  const [breakElapsedMinutes, setBreakElapsedMinutes] = useState(0);

  // Fetch today's breaks for work time calculation
  const today = useMemo(() => toLocalDateStr(new Date()), []);
  const { data: todayBreaksData } = useMyBreaks({
    startDate: today,
    endDate: today,
  });

  // Live worked hours clock
  const [workedSeconds, setWorkedSeconds] = useState(0);
  const todayDate = useMemo(() => formatDate(new Date(), "long"), [formatDate]);
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    // Calculate total break time in seconds
    const calculateBreakSeconds = () => {
      let totalBreakSeconds = 0;
      // Add completed breaks
      if (todayBreaksData?.data) {
        todayBreaksData.data.forEach((breakRecord: AttendanceBreak) => {
          if (breakRecord.endTime) {
            const start = new Date(breakRecord.startTime).getTime();
            const end = new Date(breakRecord.endTime).getTime();
            totalBreakSeconds += Math.floor((end - start) / 1000);
          }
        });
      }
      // Add active break time
      if (activeBreak?.startTime) {
        const start = new Date(activeBreak.startTime).getTime();
        const now = Date.now();
        totalBreakSeconds += Math.floor((now - start) / 1000);
      }

      return totalBreakSeconds;
    };

    if (todayAttendance?.signIn && !todayAttendance?.signOut) {
      const signIn = new Date(todayAttendance.signIn);
      interval = setInterval(() => {
        const totalSeconds = Math.floor((Date.now() - signIn.getTime()) / 1000);
        const breakSeconds = calculateBreakSeconds();
        setWorkedSeconds(Math.max(0, totalSeconds - breakSeconds));
      }, 1000);
      // Set initial value
      const totalSeconds = Math.floor((Date.now() - signIn.getTime()) / 1000);
      const breakSeconds = calculateBreakSeconds();
      setWorkedSeconds(Math.max(0, totalSeconds - breakSeconds));
    } else if (todayAttendance?.signIn && todayAttendance?.signOut) {
      const signIn = new Date(todayAttendance.signIn);
      const signOut = new Date(todayAttendance.signOut);
      const totalSeconds = Math.floor((signOut.getTime() - signIn.getTime()) / 1000);
      const breakSeconds = calculateBreakSeconds();
      setWorkedSeconds(Math.max(0, totalSeconds - breakSeconds));
    } else {
      setWorkedSeconds(0);
    }
    return () => interval && clearInterval(interval);
  }, [todayAttendance?.signIn, todayAttendance?.signOut, todayBreaksData?.data, activeBreak?.startTime]);

  // Pie chart data for monthly leaves
  const { data: leaves } = useMyLeaves(userId);
  const { currentMonth, currentYear } = useMemo(() => {
    const now = new Date();
    return { currentMonth: now.getMonth(), currentYear: now.getFullYear() };
  }, []);
  const monthlyLeaves = useMemo(() => (leaves || []).filter((l: LeaveRecord) => {
    const start = new Date(l.startDate);
    return start.getMonth() === currentMonth && start.getFullYear() === currentYear;
  }), [leaves, currentMonth, currentYear]);
  const leaveTypeMap: Record<string, { name: string; value: number; color: string }> = {};
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c", "#d0ed57", "#fa8072"];
  let colorIdx = 0;
  for (const leave of monthlyLeaves) {
    const type = leave.leaveType?.name || "Other";
    if (!leaveTypeMap[type]) {
      leaveTypeMap[type] = { name: type, value: 0, color: colors[colorIdx % colors.length] };
      colorIdx++;
    }
    leaveTypeMap[type].value += 1;
  }


  // Calculate break elapsed time
  useEffect(() => {
    if (!activeBreak?.startTime) {
      setBreakElapsedMinutes(0);
      return;
    }

    const updateElapsed = () => {
      const start = new Date(activeBreak.startTime);
      const now = new Date();
      const minutes = Math.floor((now.getTime() - start.getTime()) / 60000);
      setBreakElapsedMinutes(minutes);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60_000);
    return () => clearInterval(interval);
  }, [activeBreak?.startTime]);


  const handleSignIn = useCallback(async () => {
    // Check if late count is (leaveDeductionDay - 1) - show warning modal before sign-in
    // But only if it hasn't been shown for this month yet
    if (monthlyLateCount === leaveDeductionDay - 1 && !hasWarningBeenShown) {
      setShowWarningModal(true);
      // Mark as shown in localStorage
      const key = getWarningModalKey();
      if (key) {
        localStorage.setItem(key, "true");
      }
      return;
    }

    // Proceed with sign-in
    await performSignIn();
  }, [monthlyLateCount, leaveDeductionDay, hasWarningBeenShown, getWarningModalKey, performSignIn]);

  // Handle warning modal confirmation - proceed with sign-in
  const handleWarningModalConfirm = useCallback(() => {
    setShowWarningModal(false);
    performSignIn();
  }, [performSignIn]);

  const handleSignOut = useCallback(async () => {
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

    // Location permission check - block if required but not granted
    if (captureEmployeeLocation && locationPermissionStatus !== "granted") {
      toast.error("Location access is required. Please grant location permission to mark attendance.");
      return;
    }

    // Get fresh geolocation for sign-out
    const geoData = await getGeolocationForAttendance(
      captureEmployeeLocation,
      getCurrentLocation,
      waitForGeolocation,
      geolocationRef,
      true // Force refresh for sign-out
    );

    // Final check - if still no location and it's required, block
    if (!geoData && captureEmployeeLocation) {
      toast.error("Unable to get your location. Please ensure location access is enabled and try again.");
      return;
    }

    const payload = await buildAttendancePayload(location, geoData, {
      includeTimezone: false,
    });

    try {
      await signOutMutation.mutateAsync(payload);
      toast.success("Signed out successfully");
      setLocation("");
      setGeolocation({});
      setGeolocationError(null);
    } catch (err: any) {
      console.error("Sign-out error:", err);
      if (err?.response?.status === 403 || err?.message?.includes("desktop") || err?.message?.includes("laptop")) {
        toast.error(err?.response?.data?.message || "Attendance is only allowed from desktop or laptop computers.");
      } else if (err?.code === "ERR_NETWORK" || err?.message?.includes("Network Error")) {
        toast.error("Network error: Please check if the backend server is running and accessible.");
      } else if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(err?.message || "Sign-out failed. Please try again.");
      }
    }
  }, [
    isDeviceAllowed,
    allowMobileAttendance,
    userMeta?.allowMobileSignIn,
    signOutMutation,
    location,
    captureEmployeeLocation,
    locationPermissionStatus,
    getCurrentLocation,
    waitForGeolocation,
    geolocationRef,
    setGeolocation,
    setGeolocationError,
  ]);

  // Leave-related queries and calculations removed from dashboard (now only on leave page)

  // Leave status icon/badge helpers removed from dashboard

  const hasSignedInToday = Boolean(todayAttendance?.signIn);

  const isTopAttendanceButtonDisabled =
    attendanceLoading ||
    signInMutation.isPending ||
    signOutMutation.isPending ||
    Boolean(todayAttendance?.signOut) ||
    !isDeviceAllowed ||
    (captureEmployeeLocation && !isLocationReady) ||
    (Boolean(activeBreak) && hasSignedInToday); // Disable if on break

  const topAttendanceStatus = attendanceLoading
    ? "Checking status…"
    : !todayAttendance
      ? "Not signed in"
      : todayAttendance.signOut
        ? "Signed out"
        : "Signed in";

  return (
    <div className="container space-y-5">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}</p>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Chips */}
          <div className="flex items-center gap-2">
            {activeBreak && (
              <Badge className="bg-orange-500/90 hover:bg-orange-600 text-white text-xs gap-1 animate-pulse">
                <Coffee className="size-3" />
                On Break
              </Badge>
            )}
            <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
              {topAttendanceStatus}
            </Badge>
          </div>

          {/* Date + Sign In/Out */}
          <div className="text-right text-xs text-muted-foreground hidden sm:block">
            <div>{todayDate}</div>
          </div>
          <div className="relative group">
            <Button
              size="sm"
              disabled={isTopAttendanceButtonDisabled}
              onClick={() => (!todayAttendance?.signIn ? handleSignIn() : handleSignOut())}
              className={cn(
                "rounded-full px-5 py-1.5 text-sm font-semibold shadow-sm transition-all",
                !todayAttendance?.signIn
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : todayAttendance?.signOut
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white"
              )}
            >
              {!todayAttendance?.signIn
                ? "Sign In"
                : todayAttendance?.signOut
                  ? "Signed Out"
                  : "Sign Out"}
            </Button>
            {activeBreak && hasSignedInToday && (
              <div className="hidden group-hover:block absolute top-full right-0 mt-2 w-48 p-2 bg-orange-100 border border-orange-300 rounded-md shadow-lg text-xs text-orange-800 z-10">
                <Coffee className="inline size-3 mr-1" />
                End your break first to sign out
              </div>
            )}
          </div>
        </div>
      </div>

      {userId && <EmployeeSummaryCard userId={userId} />}

      {/* Live Counters Row */}
      <div className="flex flex-wrap gap-3 items-stretch">
        {/* Work Time Counter */}
        <Card className="flex-1 min-w-[180px] border-green-200/60 dark:border-green-800/40">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40">
              <span className="text-lg">⏱️</span>
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Work Time</p>
              <p className="font-mono text-xl font-bold text-green-700 dark:text-green-400 tabular-nums leading-tight">{formatWorkedTime(workedSeconds)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Break Counter */}
        {hasSignedInToday && activeBreak && (
          <Card className="flex-1 min-w-[180px] border-orange-200/60 dark:border-orange-800/40 bg-orange-50/30 dark:bg-orange-950/10">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/40">
                <span className="text-lg">{getBreakTypeIcon(activeBreak.breakType)}</span>
              </div>
              <div>
                <p className="text-[11px] font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">{getBreakTypeLabel(activeBreak.breakType)}</p>
                <p className="font-mono text-xl font-bold text-orange-700 dark:text-orange-400 tabular-nums leading-tight">
                  {Math.floor(breakElapsedMinutes / 60)}h {breakElapsedMinutes % 60}m
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Section Header: Attendance & Breaks */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Attendance & Breaks</h2>
        {hasSignedInToday && (
          <Link href="/dashboard/employee/attendance/reconciliation">
            <Button variant="outline" size="sm" className="text-xs">
              Attendance Reconciliation
            </Button>
          </Link>
        )}
      </div>

      {!hasSignedInToday && !attendanceLoading && (
        <Card className="border border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-900/10">
          <CardContent className="py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <ClockAlert className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium">You haven&apos;t signed in today</p>
              <p className="text-xs text-muted-foreground">
                Tap the sign-in button to mark your attendance for today.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Late Count */}
      {monthlyLateCount > 0 && (
        <Card className={cn(
          "border",
          monthlyLateCount >= 3
            ? "border-yellow-500/60 bg-yellow-50/50 dark:bg-yellow-950/20"
            : "border-orange-200/60"
        )}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  monthlyLateCount >= 3 ? "bg-yellow-100 dark:bg-yellow-900/40" : "bg-orange-100 dark:bg-orange-900/40"
                )}>
                  <ClockAlert
                    className={cn(
                      "h-4 w-4",
                      monthlyLateCount >= 3 ? "text-yellow-600" : "text-orange-600"
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Monthly Late Count</p>
                  <p className="text-xs text-muted-foreground">
                    {monthlyLateCount >= leaveDeductionDay - 1
                      ? `Warning: One more late will result in a leave adjustment.`
                      : `Leave is deducted starting from the ${leaveDeductionDay}th late in a month.`}
                  </p>
                </div>
              </div>
              <Badge
                variant={monthlyLateCount >= 3 ? "destructive" : "secondary"}
                className="text-base px-3 py-0.5 tabular-nums"
              >
                {monthlyLateCount}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 1: AttendanceCard + BreakTracker side by side */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
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
          <Card className="flex flex-col items-center justify-center border-dashed border-2 border-muted-foreground/20 min-h-[280px]">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Coffee className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Break Tracker</p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
                Sign in first to start tracking your breaks.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 2: AttendanceCharts + BreakHistoryCard side by side */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <AttendanceCharts attendanceBarData={attendanceBarData} />

        {hasSignedInToday ? (
          <BreakHistoryCard />
        ) : (
          <Card className="flex flex-col items-center justify-center border-dashed border-2 border-muted-foreground/20 min-h-[280px]">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <History className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Break History</p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
                Your break history for today will appear here after you sign in.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Late Attendance Modals */}
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
