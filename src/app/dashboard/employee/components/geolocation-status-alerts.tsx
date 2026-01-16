"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import type { GeolocationStatus } from "../hooks/use-geolocation";

interface GeolocationStatusAlertsProps {
  geolocationStatus: GeolocationStatus;
  geolocationError: string | null;
}

export function GeolocationStatusAlerts({
  geolocationStatus,
  geolocationError,
}: GeolocationStatusAlertsProps) {
  return (
    <>
      {geolocationStatus === "checking" && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 py-2.5">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="font-medium text-sm">
            Getting your location...
          </AlertDescription>
        </Alert>
      )}

      {geolocationStatus === "denied" && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20 py-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-1">
            <p className="font-semibold text-sm">Geolocation Access Required</p>
            <p className="text-xs text-muted-foreground mt-1">
              Location access is required to mark attendance. Please enable location permissions in your browser settings.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <strong>How to enable:</strong> Click the location icon in your browser's address bar and select "Allow" or go to your browser settings → Privacy → Location → Allow for this site.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {geolocationStatus === "unavailable" && geolocationError && (
        <Alert variant="destructive" className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 py-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold text-sm">Geolocation Unavailable</p>
            <p className="text-xs text-muted-foreground mt-1">
              {geolocationError}
            </p>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
