import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

const LOCATION_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache duration
const LOCATION_STALE_THRESHOLD = 30 * 1000; // 30 seconds - consider refreshing if older

// Desktop machines (especially Macs) have no GPS. CoreLocation / Chrome's
// Google location backend needs far more time than mobile GPS on a cold call,
// and high-accuracy mode frequently returns POSITION_UNAVAILABLE on Ethernet,
// VPN, or corporate Wi-Fi. These tunables give desktop a realistic budget and
// prefer low-accuracy mode which is far more reliable on no-GPS hardware.
const DESKTOP_HIGH_ACCURACY_TIMEOUT = 25_000;
const DESKTOP_LOW_ACCURACY_TIMEOUT = 12_000;
const MOBILE_HIGH_ACCURACY_TIMEOUT = 15_000;
const MOBILE_LOW_ACCURACY_TIMEOUT = 8_000;
const WATCH_POSITION_TIMEOUT = 20_000;
const PERMISSION_FALLBACK_TIMEOUT = 15_000;

// Best-effort desktop detection. Mirrors the heuristic used in
// `@/lib/utils/device-detection` but kept local to avoid a circular dep and to
// keep the hook framework-agnostic. Treats UA-unknown as desktop (safer).
function isLikelyDesktop(): boolean {
  if (typeof navigator === "undefined") return true;
  const ua = (navigator.userAgent || "").toLowerCase();
  return !/android.*mobile|iphone|ipod|ipad|blackberry|iemobile|opera mini|mobile/i.test(
    ua,
  );
}

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
  const hasAutoPromptedRef = useRef(false);
  // MEDIUM-1: stable in-progress flag — avoids stale closure on isGettingLocation state
  const isGettingLocationRef = useRef(false);
  // LOW-1: pending resolvers resolved when watchPosition fires, avoiding polling loops
  const pendingLocationResolversRef = useRef<
    Array<
      (geo: {
        latitude: number;
        longitude: number;
        address?: string;
      } | null) => void
    >
  >([]);

  useEffect(() => {
    geolocationRef.current = geolocation;
  }, [geolocation]);

  // Computed: Is location ready for attendance?
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

  // MEDIUM-3: stopWatchingPosition as a stable useCallback so onchange handlers
  // always reference the latest version across effect re-runs.
  const stopWatchingPosition = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // MEDIUM-3: startWatchingPosition as a stable useCallback for the same reason.
  const startWatchingPosition = useCallback(() => {
    if (watchIdRef.current !== null) return; // Already watching

    // Desktops (esp. Macs) have no GPS; high-accuracy forces a slow Wi-Fi
    // BSSID scan that frequently fails on wired/VPN networks. Low-accuracy
    // is dramatically more reliable and still street-level precise.
    const useHighAccuracy = !isLikelyDesktop();

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

        // LOW-1: resolve pending waiters immediately when position arrives
        const resolvers = pendingLocationResolversRef.current.splice(0);
        resolvers.forEach((resolve) => resolve({ latitude, longitude }));
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeolocationStatus("denied");
          setLocationPermissionStatus("denied");
          stopWatchingPosition();
        }
      },
      {
        enableHighAccuracy: useHighAccuracy,
        timeout: WATCH_POSITION_TIMEOUT,
        maximumAge: LOCATION_STALE_THRESHOLD,
      },
    );
  }, [stopWatchingPosition]);

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

          // MEDIUM-3: onchange now references stable callbacks — safe across re-runs
          permissionStatus.onchange = () => {
            const newState = permissionStatus.state as
              | "granted"
              | "denied"
              | "prompt";
            setLocationPermissionStatus(newState);

            if (newState === "granted") {
              startWatchingPosition();
            } else {
              stopWatchingPosition();
            }
          };
        } catch {
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
        {
          enableHighAccuracy: !isLikelyDesktop(),
          timeout: PERMISSION_FALLBACK_TIMEOUT,
          maximumAge: LOCATION_CACHE_DURATION,
        },
      );
    };

    checkLocationPermission();

    return () => {
      stopWatchingPosition();
    };
  }, [captureEmployeeLocation, startWatchingPosition, stopWatchingPosition]);

  // Auto-prompt for location permission on first visit if status is "prompt"
  useEffect(() => {
    if (!captureEmployeeLocation) return;
    if (hasAutoPromptedRef.current) return;
    if (locationPermissionStatus !== "prompt") return;

    hasAutoPromptedRef.current = true;

    const timeoutId = setTimeout(() => {
      const desktop = isLikelyDesktop();
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setGeolocation({ latitude, longitude, timestamp: Date.now() });
          setGeolocationStatus("available");
          setLocationPermissionStatus("granted");
          // HIGH-2: start watching after the user grants permission here
          startWatchingPosition();
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
          enableHighAccuracy: !desktop,
          timeout: desktop
            ? DESKTOP_HIGH_ACCURACY_TIMEOUT
            : MOBILE_HIGH_ACCURACY_TIMEOUT,
          maximumAge: LOCATION_CACHE_DURATION,
        },
      );
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [captureEmployeeLocation, locationPermissionStatus, startWatchingPosition]);

  // Optimized getCurrentLocation - uses cached data from watchPosition when available
  const getCurrentLocation = useCallback(
    async (
      forceRefresh: boolean = false,
    ): Promise<{
      latitude: number;
      longitude: number;
      address?: string;
    } | null> => {
      if (locationPermissionStatus === "denied") {
        return null;
      }

      const currentGeo = geolocationRef.current;
      // HIGH-1: use !== undefined instead of falsy check — 0 is a valid coordinate
      if (
        !forceRefresh &&
        currentGeo.latitude !== undefined &&
        currentGeo.longitude !== undefined &&
        currentGeo.timestamp
      ) {
        const age = Date.now() - currentGeo.timestamp;
        if (age < LOCATION_CACHE_DURATION) {
          return {
            latitude: currentGeo.latitude,
            longitude: currentGeo.longitude,
            address: currentGeo.address,
          };
        }
      }

      // MEDIUM-1: use ref for concurrent guard — state value is stale in same render cycle
      if (isGettingLocationRef.current) {
        // LOW-1: Promise-based wait — no polling loop
        return new Promise((resolve) => {
          pendingLocationResolversRef.current.push(resolve);
          // Safety timeout after 3 seconds
          setTimeout(() => {
            const idx = pendingLocationResolversRef.current.indexOf(resolve);
            if (idx !== -1) {
              pendingLocationResolversRef.current.splice(idx, 1);
              const geo = geolocationRef.current;
              // HIGH-1: undefined check
              if (
                geo.latitude !== undefined &&
                geo.longitude !== undefined
              ) {
                resolve({
                  latitude: geo.latitude,
                  longitude: geo.longitude,
                  address: geo.address,
                });
              } else {
                resolve(null);
              }
            }
          }, 3000);
        });
      }

      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          setGeolocationStatus("unavailable");
          setGeolocationError("Geolocation is not supported by your browser");
          resolve(null);
          return;
        }

        // MEDIUM-1: set ref immediately so concurrent calls see it right away
        isGettingLocationRef.current = true;
        setIsGettingLocation(true);
        setGeolocationStatus("checking");

        // Desktop machines (esp. Macs) have no GPS. Starting in high-accuracy
        // mode triggers a slow Wi-Fi BSSID scan that frequently fails on
        // Ethernet/VPN/corporate networks, returning POSITION_UNAVAILABLE.
        // Start in low-accuracy on desktop; mobile keeps its GPS-first path.
        const desktop = isLikelyDesktop();

        const timeoutFor = (highAccuracy: boolean) =>
          desktop
            ? highAccuracy
              ? DESKTOP_HIGH_ACCURACY_TIMEOUT
              : DESKTOP_LOW_ACCURACY_TIMEOUT
            : highAccuracy
              ? MOBILE_HIGH_ACCURACY_TIMEOUT
              : MOBILE_LOW_ACCURACY_TIMEOUT;

        const tryGetPosition = (highAccuracy: boolean) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;

              const geoData: GeolocationData = {
                latitude,
                longitude,
                timestamp: Date.now(),
              };
              setGeolocation(geoData);
              setGeolocationError(null);
              setGeolocationStatus("available");
              setLocationPermissionStatus("granted");
              isGettingLocationRef.current = false; // MEDIUM-1
              setIsGettingLocation(false);

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
                  // On Mac/desktop, high-accuracy mode commonly returns
                  // POSITION_UNAVAILABLE when Wi-Fi BSSID scanning fails
                  // (Ethernet, VPN, corporate network). Retry in low-accuracy
                  // before surfacing an error to the user.
                  if (highAccuracy) {
                    tryGetPosition(false);
                    return;
                  }
                  setGeolocationStatus("unavailable");
                  errorMessage =
                    "Location information unavailable. Check that Location Services are enabled for your browser in system settings.";
                  break;
                case error.TIMEOUT:
                  // LOW-5: retry with low accuracy before giving up
                  if (highAccuracy) {
                    tryGetPosition(false);
                    return;
                  }
                  setGeolocationStatus("unavailable");
                  errorMessage = "Location request timed out";
                  // Fall back to cached location if available
                  {
                    const cachedGeo = geolocationRef.current;
                    // HIGH-1: undefined check
                    if (
                      cachedGeo.latitude !== undefined &&
                      cachedGeo.longitude !== undefined
                    ) {
                      isGettingLocationRef.current = false; // MEDIUM-1
                      setIsGettingLocation(false);
                      resolve({
                        latitude: cachedGeo.latitude,
                        longitude: cachedGeo.longitude,
                        address: cachedGeo.address,
                      });
                      return;
                    }
                  }
                  // LOW-2: removed dead `break` that followed a `return`
                  break;
                default:
                  setGeolocationStatus("unavailable");
                  errorMessage = error.message || "Unable to determine location";
              }

              setGeolocationError(errorMessage);
              isGettingLocationRef.current = false; // MEDIUM-1
              setIsGettingLocation(false);
              resolve(null);
            },
            {
              enableHighAccuracy: highAccuracy,
              timeout: timeoutFor(highAccuracy),
              maximumAge: forceRefresh ? 0 : LOCATION_STALE_THRESHOLD,
            },
          );
        };

        // Desktop starts in low-accuracy (no GPS, faster, more reliable);
        // mobile starts in high-accuracy to leverage GPS.
        tryGetPosition(!desktop);
      });
    },
    [locationPermissionStatus],
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
        // MEDIUM-2: query the Permissions API directly instead of reading stale state
        if ("permissions" in navigator) {
          try {
            const perm = await navigator.permissions.query({
              name: "geolocation" as PermissionName,
            });
            if (perm.state === "denied") {
              setLocationPermissionStatus("denied");
              toast.error(
                "Location access denied. Please enable location permissions in your browser settings.",
              );
            } else {
              setLocationPermissionStatus("prompt");
              toast.error("Unable to get location. Please try again.");
            }
          } catch {
            toast.error("Unable to get location. Please try again.");
          }
        } else {
          toast.error(
            "Unable to get location. Please enable location permissions in your browser settings.",
          );
        }
      }
    } catch {
      setLocationPermissionStatus("denied");
    } finally {
      setIsGettingLocation(false);
    }
  }, [getCurrentLocation]);

  // LOW-1: Promise-based wait — no polling loop
  const waitForGeolocation = useCallback(async (): Promise<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null> => {
    // Return immediately if location is already available
    const currentGeo = geolocationRef.current;
    // HIGH-1: undefined check
    if (
      currentGeo.latitude !== undefined &&
      currentGeo.longitude !== undefined
    ) {
      return {
        latitude: currentGeo.latitude,
        longitude: currentGeo.longitude,
        address: currentGeo.address,
      };
    }

    // Wait for watchPosition to fire, with a 3-second safety timeout
    return new Promise((resolve) => {
      pendingLocationResolversRef.current.push(resolve);
      setTimeout(() => {
        const idx = pendingLocationResolversRef.current.indexOf(resolve);
        if (idx !== -1) {
          pendingLocationResolversRef.current.splice(idx, 1);
          const geo = geolocationRef.current;
          // HIGH-1: undefined check
          if (geo.latitude !== undefined && geo.longitude !== undefined) {
            resolve({
              latitude: geo.latitude,
              longitude: geo.longitude,
              address: geo.address,
            });
          } else {
            resolve(null);
          }
        }
      }, 3000);
    });
  }, []);

  return {
    geolocation,
    geolocationError,
    geolocationStatus,
    isGettingLocation,
    locationPermissionStatus,
    isLocationReady,
    isLocationBlocked,
    geolocationRef,       // kept: used by page.tsx and attendance-handlers.ts
    getCurrentLocation,
    requestLocationAccess,
    waitForGeolocation,
    setGeolocation,       // kept: used by page.tsx
    setGeolocationError,  // kept: used by page.tsx
  };
}
