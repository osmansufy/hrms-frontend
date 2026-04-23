"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Coffee, Loader2, LogOut } from "lucide-react";

interface SignOutButtonProps {
  hasSignedInToday: boolean;
  hasSignedOutToday: boolean;
  isPending: boolean;
  isOtherMutationPending: boolean;
  attendanceLoading: boolean;
  isDeviceAllowed: boolean;
  captureEmployeeLocation: boolean;
  isLocationReady: boolean;
  activeBreak: unknown;
  onSignOut: () => Promise<void>;
}

export function SignOutButton({
  hasSignedInToday,
  hasSignedOutToday,
  isPending,
  isOtherMutationPending,
  attendanceLoading,
  isDeviceAllowed,
  captureEmployeeLocation,
  isLocationReady,
  activeBreak,
  onSignOut,
}: SignOutButtonProps) {
  // Synchronous re-entry lock — blocks the second click of a double-click
  // before React has a chance to commit the `disabled` prop.
  const inFlightRef = useRef(false);

  const isOnBreak = Boolean(activeBreak) && hasSignedInToday && !hasSignedOutToday;

  const disabled =
    attendanceLoading ||
    !isDeviceAllowed ||
    (captureEmployeeLocation && !isLocationReady) ||
    isPending ||
    isOtherMutationPending ||
    !hasSignedInToday ||
    hasSignedOutToday ||
    isOnBreak;

  const handleClick = async () => {
    if (inFlightRef.current || disabled) return;
    inFlightRef.current = true;
    try {
      await onSignOut();
    } finally {
      inFlightRef.current = false;
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        onClick={handleClick}
        disabled={disabled}
        aria-label="Sign out"
        className={cn(
          "rounded-full w-20 h-20 p-0 transition-all duration-300",
          "shadow-xl active:scale-95 ring-4",
          !disabled
            ? "bg-red-600 hover:bg-red-700 hover:scale-105 hover:shadow-2xl shadow-red-500/50 dark:shadow-red-900/50 ring-red-200/50 dark:ring-red-900/30"
            : "bg-muted hover:bg-muted cursor-not-allowed ring-muted shadow-none"
        )}
      >
        {isPending ? (
          <Loader2 className="size-6 animate-spin text-white" />
        ) : hasSignedOutToday ? (
          <CheckCircle2 className="size-6 text-muted-foreground" />
        ) : isOnBreak ? (
          <Coffee className="size-6 text-orange-500" />
        ) : (
          <LogOut
            className={cn(
              "size-6",
              !disabled ? "text-white" : "text-muted-foreground"
            )}
          />
        )}
      </Button>
      <p
        className={cn(
          "text-sm font-semibold transition-colors",
          hasSignedOutToday
            ? "text-muted-foreground"
            : !disabled
              ? "text-red-700 dark:text-red-300"
              : isOnBreak
                ? "text-orange-600 dark:text-orange-400"
                : "text-muted-foreground"
        )}
      >
        {hasSignedOutToday ? "Signed Out" : "Sign Out"}
      </p>
    </div>
  );
}
