"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationPermissionStatus } from "../hooks/use-geolocation";

interface LocationPermissionAlertProps {
  captureEmployeeLocation: boolean;
  locationPermissionStatus: LocationPermissionStatus;
  isGettingLocation: boolean;
  onRequestAccess: () => void;
}

export function LocationPermissionAlert({
  captureEmployeeLocation,
  locationPermissionStatus,
  isGettingLocation,
  onRequestAccess,
}: LocationPermissionAlertProps) {
  if (!captureEmployeeLocation || locationPermissionStatus === null) {
    return null;
  }

  return (
    <Alert 
      className={cn(
        "py-3",
        locationPermissionStatus === "granted" 
          ? "border-green-200 bg-green-50 dark:bg-green-950/20"
          : locationPermissionStatus === "denied"
          ? "border-red-200 bg-red-50 dark:bg-red-950/20"
          : "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          {locationPermissionStatus === "granted" ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
          ) : locationPermissionStatus === "denied" ? (
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
          ) : (
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
          )}
          <AlertDescription className="flex-1">
            <p className="font-semibold text-sm mb-1">
              Location Permission: {
                locationPermissionStatus === "granted" 
                  ? "Granted ✓" 
                  : locationPermissionStatus === "denied"
                  ? "Denied"
                  : "Not Set"
              }
            </p>
            {locationPermissionStatus === "granted" && (
              <p className="text-xs text-muted-foreground">
                Your location will be captured when marking attendance.
              </p>
            )}
            {locationPermissionStatus === "denied" && (
              <p className="text-xs text-muted-foreground">
                Location access is required for attendance. Please enable it in your browser settings.
              </p>
            )}
            {(locationPermissionStatus === "prompt" || locationPermissionStatus === "unavailable") && (
              <p className="text-xs text-muted-foreground">
                Click the button below to grant location access for attendance tracking.
              </p>
            )}
          </AlertDescription>
        </div>
        {locationPermissionStatus !== "granted" && (
          <Button
            onClick={onRequestAccess}
            disabled={isGettingLocation}
            size="sm"
            variant={locationPermissionStatus === "denied" ? "destructive" : "default"}
            className="shrink-0"
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <MapPin className="h-3 w-3 mr-1" />
                Grant Access
              </>
            )}
          </Button>
        )}
      </div>
    </Alert>
  );
}
