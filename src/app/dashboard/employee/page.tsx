"use client";

import { useSession } from "@/components/auth/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useMonthlyLateCount, useMyAttendanceRecords, useMyLostHoursReport, useSignIn,
  useSignOut,
  useTodayAttendance
} from "@/lib/queries/attendance";
import { useMyLeaves } from "@/lib/queries/leave";
import { useSystemSettings } from "@/lib/queries/system-settings";
import { cn, formatDateInDhaka } from "@/lib/utils";
import {
  detectDevice,
  isDeviceAllowedForAttendance
} from "@/lib/utils/device-detection";
import { ClockAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AttendanceCard } from "./components/attendance-card";
import { AttendanceCharts } from "./components/attendance-charts";
import { LateAttendanceConfirmationModal } from "./components/late-attendance-confirmation-modal";
import { LateAttendanceWarningModal } from "./components/late-attendance-warning-modal";
import { useGeolocation } from "./hooks/use-geolocation";
import { buildAttendancePayload, getGeolocationForAttendance } from "./utils/attendance-handlers";



export default function EmployeeDashboard() {

  // Session and userId
  const { session } = useSession();
  const userId = session?.user.id;

  // System settings (late threshold, mobile attendance, location capture)
  const { data: systemSettings } = useSystemSettings();
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

  // Attendance chart data for last 7 days
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - 6);
  const chartQueryParams = {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
    limit: "7",
  };
  const { data: attendanceChartData } = useMyAttendanceRecords(userId, chartQueryParams);
  const attendanceBarData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const dateStr = formatDateInDhaka(d, "short");
    const rec = attendanceChartData?.data?.find(r => {
      const recDate = new Date(r.date);
      return recDate.getUTCFullYear() === d.getUTCFullYear() && recDate.getUTCMonth() === d.getUTCMonth() && recDate.getUTCDate() === d.getUTCDate();
    });
    return {
      date: dateStr,
      present: rec?.signIn ? 1 : 0,
      late: rec?.isLate ? 1 : 0,
      absent: rec?.signIn ? 0 : 1,
    };
  });

  // Location state
  const [location, setLocation] = useState("");

  // Geolocation hook - handles all geolocation logic
  const {
    geolocation,
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
    // If mobile attendance is allowed via system settings, we don't block on device
    if (allowMobileAttendance) {
      setIsDeviceAllowed(true);
    } else {
      setIsDeviceAllowed(isDeviceAllowedForAttendance());
    }
  }, [allowMobileAttendance]);

  // Attendance queries
  const { data: todayAttendance, isLoading: attendanceLoading, isFetching: attendanceFetching } = useTodayAttendance(userId);
  const signInMutation = useSignIn(userId);
  const signOutMutation = useSignOut(userId);

  // Attendance handlers - using utility functions
  const performSignIn = useCallback(async () => {
    // Device check
    if (!isDeviceAllowedForAttendance()) {
      const device = detectDevice();
      toast.error(device.type === "mobile" ? "Attendance is only allowed from desktop or laptop computers." : "Device not allowed");
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
    console.log("Final payload before API call:", payload);

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
    signInMutation,
    location,
    captureEmployeeLocation,
    locationPermissionStatus,
    getCurrentLocation,
    waitForGeolocation,
    geolocationRef,
    setGeolocationError,
  ]);

  // Live worked hours clock
  const [workedSeconds, setWorkedSeconds] = useState(0);
  const todayDate = formatDateInDhaka(new Date(), "long");
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (todayAttendance?.signIn && !todayAttendance?.signOut) {
      const signIn = new Date(todayAttendance.signIn);
      interval = setInterval(() => {
        setWorkedSeconds(Math.floor((Date.now() - signIn.getTime()) / 1000));
      }, 1000);
      // Set initial value
      setWorkedSeconds(Math.floor((Date.now() - signIn.getTime()) / 1000));
    } else if (todayAttendance?.signIn && todayAttendance?.signOut) {
      const signIn = new Date(todayAttendance.signIn);
      const signOut = new Date(todayAttendance.signOut);
      setWorkedSeconds(Math.floor((signOut.getTime() - signIn.getTime()) / 1000));
    } else {
      setWorkedSeconds(0);
    }
    return () => interval && clearInterval(interval);
  }, [todayAttendance?.signIn, todayAttendance?.signOut]);

  function formatWorkedTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }


  // Pie chart data for monthly leaves
  const { data: leaves } = useMyLeaves(userId);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyLeaves = (leaves || []).filter(l => {
    const start = new Date(l.startDate);
    return start.getMonth() === currentMonth && start.getFullYear() === currentYear;
  });
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
  const pieData = Object.values(leaveTypeMap);

  // Lost hours report for last 7 days
  const start7 = new Date();
  start7.setDate(start7.getDate() - 7);
  const { data: lostHoursData } = useMyLostHoursReport(userId, {
    startDate: start7.toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });


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
  }, [monthlyLateCount, leaveDeductionDay, performSignIn]);

  // Handle warning modal confirmation - proceed with sign-in
  const handleWarningModalConfirm = useCallback(() => {
    setShowWarningModal(false);
    performSignIn();
  }, [performSignIn]);

  const handleSignOut = useCallback(async () => {
    // Device check
    if (!isDeviceAllowedForAttendance()) {
      const device = detectDevice();
      toast.error(device.type === "mobile" ? "Attendance is only allowed from desktop or laptop computers." : "Device not allowed");
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

    const payload = await buildAttendancePayload(location, geoData);
    console.log("Final sign-out payload before API call:", payload);

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

  return (
    <div className="container space-y-6">
      <div className="flex justify-between items-center mb-2">
        <Badge variant="outline" className="text-base px-4 py-2  from-blue-50 to-indigo-50 border-blue-400 text-blue-900 font-semibold tracking-wide rounded-full">
          {`Keep pushing! Your productivity matters${session?.user?.name ? ", " + session.user.name : ""}. 🚀`}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-4 items-center justify-end">
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground">Date</span>
          <span className="font-medium">{todayDate}</span>
        </div>
        <div className="flex flex-col items-end px-4 py-3 rounded-lg  from-green-100 to-emerald-100 border-2 border-green-400 shadow-md hover:shadow-lg transition-shadow">
          <span className="text-xs font-semibold text-green-700 uppercase tracking-widest">⏱️ Live Work Time</span>
          <span className="font-mono text-2xl font-bold text-green-700">{formatWorkedTime(workedSeconds)}</span>
        </div>
      </div>
      <div className="flex justify-end">
        <Link href="/dashboard/employee/attendance/reconciliation">
          <Button variant="secondary">Attendance Reconciliation</Button>
        </Link>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-semibold">Your Dashboard</h1>
        </div>
      </div>


      {/* Monthly Late Count */}
      {monthlyLateCount > 0 && (
        <Card className={cn(
          "border-2",
          monthlyLateCount >= 3 ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" : "border-orange-200"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClockAlert className={cn(
                  "h-5 w-5",
                  monthlyLateCount >= 3 ? "text-yellow-600" : "text-orange-600"
                )} />
                <div>
                  <p className="text-sm font-medium">Monthly Late Count</p>
                  <p className="text-xs text-muted-foreground">
                    {monthlyLateCount >= leaveDeductionDay - 1
                      ? `Warning: One more late will reach the configured leave deduction threshold (${leaveDeductionDay})`
                      : `Keep track of your attendance. Leave is deducted starting from the ${leaveDeductionDay}th late in a month.`}
                  </p>
                </div>
              </div>
              <Badge
                variant={monthlyLateCount >= 3 ? "destructive" : "secondary"}
                className="text-lg px-4 py-1"
              >
                {monthlyLateCount} /month
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Attendance</h2>
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
          onRequestLocationAccess={requestLocationAccess}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          location={location}
          onLocationChange={setLocation}
        />
      </div>

      {/* Attendance Charts */}
      <AttendanceCharts attendanceBarData={attendanceBarData} />



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
