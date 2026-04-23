"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  CheckCircle2,
  LogOut,
  MapPin,
  Monitor,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatTimeInTimezone } from "@/lib/utils";
import {
  detectDevice,
  getDeviceRestrictionMessage,
} from "@/lib/utils/device-detection";
import { LocationPermissionAlert } from "./location-permission-alert";
import { GeolocationStatusAlerts } from "./geolocation-status-alerts";
import { AttendanceActionButtons, type AttendanceBlockReason } from "./attendance-action-buttons";
import type { GeolocationStatus, LocationPermissionStatus } from "../hooks/use-geolocation";

interface AttendanceCardProps {
  todayAttendance: any;
  attendanceLoading: boolean;
  attendanceFetching: boolean;
  signInMutation: any;
  signOutMutation: any;
  captureEmployeeLocation: boolean;
  deviceInfo: ReturnType<typeof detectDevice> | null;
  isDeviceAllowed: boolean;
  geolocationStatus: GeolocationStatus;
  geolocationError: string | null;
  locationPermissionStatus: LocationPermissionStatus;
  isGettingLocation: boolean;
  isLocationReady: boolean;
  isLocationBlocked: boolean;
  activeBreak: any;
  onRequestLocationAccess: () => void;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  location: string;
  onLocationChange: (location: string) => void;
}

export function AttendanceCard({
  todayAttendance,
  attendanceLoading,
  attendanceFetching,
  signInMutation,
  signOutMutation,
  captureEmployeeLocation,
  deviceInfo,
  isDeviceAllowed,
  geolocationStatus,
  geolocationError,
  locationPermissionStatus,
  isGettingLocation,
  isLocationReady,
  activeBreak,
  onRequestLocationAccess,
  onSignIn,
  onSignOut,
  location,
  onLocationChange,
}: AttendanceCardProps) {
  const hasSignedInToday = Boolean(todayAttendance?.signIn);
  const hasSignedOutToday = Boolean(todayAttendance?.signOut);
  const isLocationPermissionGranted = locationPermissionStatus === "granted";
  const blockReason: AttendanceBlockReason = !isDeviceAllowed
    ? "device"
    : captureEmployeeLocation && !isLocationReady
      ? "location"
      : activeBreak && hasSignedInToday && !hasSignedOutToday
        ? "break"
        : null;

  const attendanceStatus = attendanceLoading
    ? "Checking status…"
    : !todayAttendance
      ? "Not signed in"
      : todayAttendance.signOut
        ? "Signed out"
        : "Signed in";

  return (
    <Card className="border-2">
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today&apos;s Attendance</CardTitle>
          <Badge
            variant={todayAttendance?.isLate ? "destructive" : "secondary"}
            className="text-xs px-2.5 py-0.5"
          >
            <Clock className="mr-1 size-3.5" />
            {attendanceStatus}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Sign in when you start and sign out when you finish. View full history on the{" "}
          <Link href="/dashboard/employee/attendance" className="text-primary hover:underline">
            attendance page
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Restriction Alert */}
        {deviceInfo && !isDeviceAllowed && (
          <Alert variant="destructive" className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 py-2.5">
            <Monitor className="h-4 w-4" />
            <AlertDescription className="font-medium text-sm">
              {getDeviceRestrictionMessage(deviceInfo.type)}
            </AlertDescription>
          </Alert>
        )}

        {/* Location Permission Status */}
        <LocationPermissionAlert
          captureEmployeeLocation={captureEmployeeLocation}
          locationPermissionStatus={locationPermissionStatus}
          isGettingLocation={isGettingLocation}
          onRequestAccess={onRequestLocationAccess}
        />

        {/* Geolocation Status Alerts */}
        <GeolocationStatusAlerts
          geolocationStatus={geolocationStatus}
          geolocationError={geolocationError}
        />

        {/* Action Buttons Container */}
        <div
          className={cn(
            "relative rounded-xl p-6 transition-all duration-300",
            blockReason !== null || hasSignedOutToday
              ? "bg-muted/30 border border-muted"
              : hasSignedInToday
                ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50"
                : "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50"
          )}
        >
          <div className="flex flex-col items-center justify-center">
            {/* Time Display */}
            {(todayAttendance?.signIn || todayAttendance?.signOut) && (
              <div className="flex items-center gap-5 mb-5 text-sm">
                {todayAttendance?.signIn && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                    <span className="text-muted-foreground">In:</span>
                    <span className="font-semibold text-green-700 dark:text-green-300">
                      {formatTimeInTimezone(todayAttendance.signIn)}
                    </span>
                  </div>
                )}
                {todayAttendance?.signOut && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                    <LogOut className="size-4 text-red-600 dark:text-red-400" />
                    <span className="text-muted-foreground">Out:</span>
                    <span className="font-semibold text-red-700 dark:text-red-300">
                      {formatTimeInTimezone(todayAttendance.signOut)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <AttendanceActionButtons
              hasSignedInToday={hasSignedInToday}
              hasSignedOutToday={hasSignedOutToday}
              isSignInPending={Boolean(signInMutation.isPending)}
              isSignOutPending={Boolean(signOutMutation.isPending)}
              attendanceLoading={attendanceLoading}
              isDeviceAllowed={isDeviceAllowed}
              captureEmployeeLocation={captureEmployeeLocation}
              isLocationReady={isLocationReady}
              isGettingLocation={isGettingLocation}
              isLocationPermissionGranted={isLocationPermissionGranted}
              activeBreak={activeBreak}
              onSignIn={onSignIn}
              onSignOut={onSignOut}
            />
          </div>
        </div>

        <Separator className="my-4" />

        {/* Enhanced Location Input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MapPin className="size-4" />
            <label htmlFor="location">Location (optional)</label>
          </div>
          <Input
            id="location"
            placeholder="e.g., Remote, Office, Client Site"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="h-10 text-sm"
          />
        </div>

        {/* Enhanced Status Message */}
        {(attendanceFetching || signInMutation.isPending || signOutMutation.isPending) && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2.5 rounded-lg border border-muted">
            <Loader2 className="size-4 animate-spin" />
            <p className="font-medium">Updating attendance…</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
