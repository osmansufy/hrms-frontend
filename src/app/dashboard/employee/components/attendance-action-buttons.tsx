"use client";

import { Coffee, Loader2, MapPin, Monitor } from "lucide-react";
import { SignInButton } from "./sign-in-button";
import { SignOutButton } from "./sign-out-button";

export type AttendanceBlockReason = "device" | "location" | "break" | null;

interface AttendanceActionButtonsProps {
  hasSignedInToday: boolean;
  hasSignedOutToday: boolean;
  isSignInPending: boolean;
  isSignOutPending: boolean;
  attendanceLoading: boolean;
  isDeviceAllowed: boolean;
  captureEmployeeLocation: boolean;
  isLocationReady: boolean;
  isGettingLocation: boolean;
  isLocationPermissionGranted: boolean;
  activeBreak: unknown;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function AttendanceActionButtons({
  hasSignedInToday,
  hasSignedOutToday,
  isSignInPending,
  isSignOutPending,
  attendanceLoading,
  isDeviceAllowed,
  captureEmployeeLocation,
  isLocationReady,
  isGettingLocation,
  isLocationPermissionGranted,
  activeBreak,
  onSignIn,
  onSignOut,
}: AttendanceActionButtonsProps) {
  const blockReason: AttendanceBlockReason = !isDeviceAllowed
    ? "device"
    : captureEmployeeLocation && !isLocationReady
      ? "location"
      : activeBreak && hasSignedInToday && !hasSignedOutToday
        ? "break"
        : null;

  const isWaitingForCoordinates =
    blockReason === "location" && isLocationPermissionGranted;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-start justify-center gap-8">
        <SignInButton
          hasSignedInToday={hasSignedInToday}
          hasSignedOutToday={hasSignedOutToday}
          isPending={isSignInPending}
          isOtherMutationPending={isSignOutPending}
          attendanceLoading={attendanceLoading}
          isDeviceAllowed={isDeviceAllowed}
          captureEmployeeLocation={captureEmployeeLocation}
          isLocationReady={isLocationReady}
          onSignIn={onSignIn}
        />

        <SignOutButton
          hasSignedInToday={hasSignedInToday}
          hasSignedOutToday={hasSignedOutToday}
          isPending={isSignOutPending}
          isOtherMutationPending={isSignInPending}
          attendanceLoading={attendanceLoading}
          isDeviceAllowed={isDeviceAllowed}
          captureEmployeeLocation={captureEmployeeLocation}
          isLocationReady={isLocationReady}
          activeBreak={activeBreak}
          onSignOut={onSignOut}
        />
      </div>

      {/* Contextual status message (device / location / break) */}
      {blockReason !== null && (
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          {blockReason === "device" && (
            <>
              <Monitor className="size-3.5" />
              <span>Desktop required to sign in</span>
            </>
          )}
          {blockReason === "location" && (
            <>
              {isWaitingForCoordinates && isGettingLocation ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <MapPin className="size-3.5" />
              )}
              <span>
                {isWaitingForCoordinates
                  ? isGettingLocation
                    ? "Getting location…"
                    : "Waiting for GPS…"
                  : "Location required"}
              </span>
            </>
          )}
          {blockReason === "break" && (
            <>
              <Coffee className="size-3.5 text-orange-500" />
              <span className="text-orange-600 dark:text-orange-400">
                End your break before signing out
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
