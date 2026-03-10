import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

const LOCATION_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache duration
const LOCATION_STALE_THRESHOLD = 30 * 1000; // 30 seconds - consider refreshing if older

export interface GeolocationData {
  latitude?: number;
  longitude?: number;
  address?: string;
  timestamp?: number;
}

export type GeolocationStatus =
  | "checking"
  | "available"
  | "denied"
  | "unavailable"
  | null;
export type LocationPermissionStatus =
  | "granted"
  | "denied"
  | "prompt"
  | "unavailable"
  | null;

export function useGeolocation(captureEmployeeLocation: boolean) {
  const [geolocation, setGeolocation] = useState<GeolocationData>({});
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [geolocationStatus, setGeolocationStatus] =
    useState<GeolocationStatus>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] =
    useState<LocationPermissionStatus>(null);

  // Use ref to track latest geolocation for checking in async contexts
  const geolocationRef = useRef(geolocation);
  const watchIdRef = useRef<number | null>(null);
  const hasAutoPromptedRef = useRef(false); // Track if we've already auto-prompted

  useEffect(() => {
    geolocationRef.current = geolocation;
  }, [geolocation]);

  // Computed: Is location ready for attendance?
  // True if we have valid coordinates or location capture is not required
  const isLocationReady =
    !captureEmployeeLocation ||
    (locationPermissionStatus === "granted" &&
      geolocation.latitude !== undefined &&
      geolocation.longitude !== undefined);

  // Computed: Is location access blocked (denied or unavailable)?
  const isLocationBlocked =
    captureEmployeeLocation &&
    (locationPermissionStatus === "denied" ||
      locationPermissionStatus === "unavailable");

  /**
   * Address reverse-geocoding intentionally disabled.
   *
   * Reason: It depends on an external API and can add noticeable latency and/or
   * fail due to rate limits, impacting sign-in/sign-out UX. Attendance only
   * requires coordinates (lat/lng); `address` remains optional.
   */

  // Check geolocation permission status on mount and start watching if granted
  useEffect(() => {
    if (!captureEmployeeLocation) return;

    const checkLocationPermission = async () => {
      if (!navigator.geolocation) {
        setLocationPermissionStatus("unavailable");
        return;
      }

      if ("permissions" in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({
            name: "geolocation" as PermissionName,
          });
          const currentState = permissionStatus.state as
            | "granted"
            | "denied"
            | "prompt";
          setLocationPermissionStatus(currentState);

          // If already granted, proactively fetch location
          if (currentState === "granted") {
            startWatchingPosition();
          }

          permissionStatus.onchange = () => {
            const newState = permissionStatus.state as
              | "granted"
              | "denied"
              | "prompt";
            setLocationPermissionStatus(newState);

            // Start watching when permission becomes granted
            if (newState === "granted") {
              startWatchingPosition();
            } else {
              stopWatchingPosition();
            }
          };
        } catch (error) {
          checkLocationPermissionFallback();
        }
      } else {
        checkLocationPermissionFallback();
      }
    };

    const checkLocationPermissionFallback = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermissionStatus("granted");
          // Update geolocation immediately
          const { latitude, longitude } = position.coords;
          setGeolocation({ latitude, longitude, timestamp: Date.now() });
          setGeolocationStatus("available");
          startWatchingPosition();
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermissionStatus("denied");
          } else {
            setLocationPermissionStatus("prompt");
          }
        },
        { timeout: 5000, maximumAge: LOCATION_CACHE_DURATION },
      );
    };

    const startWatchingPosition = () => {
      if (watchIdRef.current !== null) return; // Already watching

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setGeolocation((prev) => ({
            ...prev,
            latitude,
            longitude,
            timestamp: Date.now(),
          }));
          setGeolocationStatus("available");
          setGeolocationError(null);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setGeolocationStatus("denied");
            setLocationPermissionStatus("denied");
            stopWatchingPosition();
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: LOCATION_STALE_THRESHOLD,
        },
      );
    };

    const stopWatchingPosition = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };

    checkLocationPermission();

    // Cleanup on unmount
    return () => {
      stopWatchingPosition();
    };
  }, [captureEmployeeLocation]);

  // Auto-prompt for location permission on first visit if status is "prompt"
  // This effect runs after permission status is determined
  useEffect(() => {
    if (!captureEmployeeLocation) return;
    if (hasAutoPromptedRef.current) return; // Already prompted once
    if (locationPermissionStatus !== "prompt") return; // Only auto-prompt when status is "prompt"

    // Mark as prompted to prevent multiple prompts
    hasAutoPromptedRef.current = true;

    // Small delay to ensure UI is rendered before showing browser prompt
    const timeoutId = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setGeolocation({ latitude, longitude, timestamp: Date.now() });
          setGeolocationStatus("available");
          setLocationPermissionStatus("granted");
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setGeolocationStatus("denied");
            setLocationPermissionStatus("denied");
            setGeolocationError(
              "Location access denied. Please enable location in browser settings.",
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: LOCATION_CACHE_DURATION,
        },
      );
    }, 500); // 500ms delay for better UX

    return () => clearTimeout(timeoutId);
  }, [captureEmployeeLocation, locationPermissionStatus]);

  // Optimized getCurrentLocation - uses cached data from watchPosition when available
  const getCurrentLocation = useCallback(
    async (
      forceRefresh: boolean = false,
    ): Promise<{
      latitude: number;
      longitude: number;
      address?: string;
    } | null> => {
      // If permission is denied, return null immediately
      if (locationPermissionStatus === "denied") {
        return null;
      }

      // Check if we have cached geolocation that's still valid
      const currentGeo = geolocationRef.current;
      if (
        !forceRefresh &&
        currentGeo.latitude &&
        currentGeo.longitude &&
        currentGeo.timestamp
      ) {
        const age = Date.now() - currentGeo.timestamp;

        // For non-forced requests, use cache if within duration
        if (age < LOCATION_CACHE_DURATION) {
          return {
            latitude: currentGeo.latitude,
            longitude: currentGeo.longitude,
            address: currentGeo.address,
          };
        }
      }

      // For force refresh or stale cache, get fresh location
      // Prevent concurrent calls
      if (isGettingLocation) {
        // Wait for up to 3 seconds for the ongoing request
        for (let i = 0; i < 30; i++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const geo = geolocationRef.current;
          if (geo.latitude && geo.longitude) {
            return {
              latitude: geo.latitude,
              longitude: geo.longitude,
              address: geo.address,
            };
          }
        }
        return null;
      }

      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          setGeolocationStatus("unavailable");
          setGeolocationError("Geolocation is not supported by your browser");
          resolve(null);
          return;
        }

        setIsGettingLocation(true);
        setGeolocationStatus("checking");

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            // Update state immediately with coordinates
            const geoData: GeolocationData = {
              latitude,
              longitude,
              timestamp: Date.now(),
            };
            setGeolocation(geoData);
            setGeolocationError(null);
            setGeolocationStatus("available");
            setLocationPermissionStatus("granted");
            setIsGettingLocation(false);

            // Return immediately without waiting for address
            resolve({ latitude, longitude, address: currentGeo.address });
          },
          (error) => {

            let errorMessage = "Failed to get location";

            switch (error.code) {
              case error.PERMISSION_DENIED:
                setGeolocationStatus("denied");
                setLocationPermissionStatus("denied");
                errorMessage =
                  "Location access denied. Please enable location access to mark attendance.";
                break;
              case error.POSITION_UNAVAILABLE:
                setGeolocationStatus("unavailable");
                errorMessage = "Location information unavailable";
                break;
              case error.TIMEOUT:
                setGeolocationStatus("unavailable");
                errorMessage = "Location request timed out";
                // On timeout, try to use cached location if available
                const cachedGeo = geolocationRef.current;
                if (cachedGeo.latitude && cachedGeo.longitude) {
                  setIsGettingLocation(false);
                  resolve({
                    latitude: cachedGeo.latitude,
                    longitude: cachedGeo.longitude,
                    address: cachedGeo.address,
                  });
                  return;
                }
                break;
              default:
                setGeolocationStatus("unavailable");
                errorMessage = error.message || "Unable to determine location";
            }

            setGeolocationError(errorMessage);
            setIsGettingLocation(false);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000, // Reduced timeout for faster feedback
            maximumAge: forceRefresh ? 0 : LOCATION_STALE_THRESHOLD,
          },
        );
      });
    },
    [isGettingLocation, locationPermissionStatus],
  );

  const requestLocationAccess = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setGeolocationStatus("checking");

    try {
      const geoData = await getCurrentLocation();
      if (geoData) {
        toast.success("Location access granted");
        setLocationPermissionStatus("granted");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (geolocationStatus === "denied") {
          setLocationPermissionStatus("denied");
          toast.error(
            "Location access denied. Please enable location permissions in your browser settings.",
          );
        } else {
          setLocationPermissionStatus("prompt");
        }
      }
    } catch (error) {
      setLocationPermissionStatus("denied");
    } finally {
      setIsGettingLocation(false);
    }
  }, [getCurrentLocation, geolocationStatus]);

  const waitForGeolocation = useCallback(async (): Promise<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null> => {
    // Wait up to 3 seconds for geolocation to become available
    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const currentGeo = geolocationRef.current;
      const currentLat = currentGeo?.latitude;
      const currentLng = currentGeo?.longitude;
      const currentAddress = currentGeo?.address;

      if (currentLat && currentLng) {
        return {
          latitude: currentLat,
          longitude: currentLng,
          address: currentAddress,
        };
      }
    }
    return null;
  }, []);

  return {
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
    setGeolocation,
    setGeolocationError,
  };
}
