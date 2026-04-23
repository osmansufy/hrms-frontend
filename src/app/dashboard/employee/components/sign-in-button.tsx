"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";

interface SignInButtonProps {
  hasSignedInToday: boolean;
  hasSignedOutToday: boolean;
  isPending: boolean;
  isOtherMutationPending: boolean;
  attendanceLoading: boolean;
  isDeviceAllowed: boolean;
  captureEmployeeLocation: boolean;
  isLocationReady: boolean;
  onSignIn: () => Promise<void>;
}

export function SignInButton({
  hasSignedInToday,
  hasSignedOutToday,
  isPending,
  isOtherMutationPending,
  attendanceLoading,
  isDeviceAllowed,
  captureEmployeeLocation,
  isLocationReady,
  onSignIn,
}: SignInButtonProps) {
  // Synchronous re-entry lock — blocks the second click of a double-click
  // before React has a chance to commit the `disabled` prop.
  const inFlightRef = useRef(false);

  const disabled =
    attendanceLoading ||
    !isDeviceAllowed ||
    (captureEmployeeLocation && !isLocationReady) ||
    isPending ||
    isOtherMutationPending ||
    hasSignedInToday ||
    hasSignedOutToday;

  const handleClick = async () => {
    if (inFlightRef.current || disabled) return;
    inFlightRef.current = true;
    try {
      await onSignIn();
    } finally {
      inFlightRef.current = false;
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        onClick={handleClick}
        disabled={disabled}
        aria-label="Sign in"
        className={cn(
          "rounded-full w-20 h-20 p-0 transition-all duration-300",
          "shadow-xl active:scale-95 ring-4",
          !disabled
            ? "bg-green-600 hover:bg-green-700 hover:scale-105 hover:shadow-2xl shadow-green-500/50 dark:shadow-green-900/50 ring-green-200/50 dark:ring-green-900/30"
            : "bg-muted hover:bg-muted cursor-not-allowed ring-muted shadow-none"
        )}
      >
        {isPending ? (
          <Loader2 className="size-6 animate-spin text-white" />
        ) : (
          <CheckCircle2
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
          hasSignedInToday
            ? "text-muted-foreground"
            : !disabled
              ? "text-green-700 dark:text-green-300"
              : "text-muted-foreground"
        )}
      >
        {hasSignedInToday ? "Signed In" : "Sign In"}
      </p>
    </div>
  );
}
