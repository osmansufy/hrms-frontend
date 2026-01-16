"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  CheckCircle2, 
  LogOut, 
  MapPin, 
  Monitor, 
  Loader2 
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatTimeInDhaka } from "@/lib/utils";
import {
  detectDevice,
  isDeviceAllowedForAttendance,
  getDeviceRestrictionMessage,
} from "@/lib/utils/device-detection";
import { LocationPermissionAlert } from "./location-permission-alert";
import { GeolocationStatusAlerts } from "./geolocation-status-alerts";
import type { GeolocationData, GeolocationStatus, LocationPermissionStatus } from "../hooks/use-geolocation";

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
  onRequestLocationAccess,
  onSignIn,
  onSignOut,
  location,
  onLocationChange,
}: AttendanceCardProps) {

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

        {/* Enhanced Circular Button Design */}
        <div className={cn(
          "relative rounded-xl p-6 transition-all duration-300",
          !todayAttendance?.signIn && isDeviceAllowed
            ? " from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-900/50"
            : todayAttendance && !todayAttendance.signOut && isDeviceAllowed
              ? " from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-900/50"
              : "bg-muted/30 border border-muted"
        )}>
          <div className="flex flex-col items-center justify-center">
            {/* Time Display */}
            {(todayAttendance?.signIn || todayAttendance?.signOut) && (
              <div className="flex items-center gap-5 mb-5 text-sm">
                {todayAttendance?.signIn && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                    <span className="text-muted-foreground">In:</span>
                    <span className="font-semibold text-green-700 dark:text-green-300">
                      {formatTimeInDhaka(todayAttendance.signIn)}
                    </span>
                  </div>
                )}
                {todayAttendance?.signOut && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800">
                    <LogOut className="size-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-muted-foreground">Out:</span>
                    <span className="font-semibold text-orange-700 dark:text-orange-300">
                      {formatTimeInDhaka(todayAttendance.signOut)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Circular Toggle Button */}
            <Button
              onClick={!todayAttendance?.signIn ? onSignIn : onSignOut}
              disabled={
                attendanceLoading ||
                signInMutation.isPending ||
                signOutMutation.isPending ||
                Boolean(todayAttendance?.signOut) ||
                !isDeviceAllowed
              }
              className={cn(
                "rounded-full w-24 h-24 p-0 transition-all duration-300",
                "shadow-2xl hover:shadow-2xl hover:scale-110 active:scale-95",
                "ring-4",
                !todayAttendance?.signIn && isDeviceAllowed
                  ? "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/50 dark:shadow-green-900/50 ring-green-200/50 dark:ring-green-900/30"
                  : todayAttendance && !todayAttendance.signOut && isDeviceAllowed
                    ? "bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/50 dark:shadow-orange-900/50 ring-orange-200/50 dark:ring-orange-900/30"
                    : "bg-muted hover:bg-muted cursor-not-allowed ring-muted shadow-none"
              )}
            >
              {attendanceLoading || signInMutation.isPending || signOutMutation.isPending ? (
                <Loader2 className="size-7 animate-spin text-white" />
              ) : !isDeviceAllowed ? (
                <Monitor className="size-7 text-white" />
              ) : !todayAttendance?.signIn ? (
                <CheckCircle2 className="size-7 text-white" />
              ) : todayAttendance?.signOut ? (
                <CheckCircle2 className="size-7 text-white" />
              ) : (
                <LogOut className="size-7 text-white" />
              )}
            </Button>

            {/* Button Label */}
            <p className={cn(
              "mt-4 text-base font-semibold transition-colors",
              !todayAttendance?.signIn && isDeviceAllowed
                ? "text-green-700 dark:text-green-300"
                : todayAttendance && !todayAttendance.signOut && isDeviceAllowed
                  ? "text-orange-700 dark:text-orange-300"
                  : "text-muted-foreground"
            )}>
              {!isDeviceAllowed
                ? "PC Required"
                : !todayAttendance?.signIn
                  ? "Sign In"
                  : todayAttendance?.signOut
                    ? "Signed Out"
                    : "Sign Out"}
            </p>
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
