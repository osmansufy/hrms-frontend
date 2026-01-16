import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

const LOCATION_CACHE_DURATION = 3 * 60 * 1000; // 3 minutes in milliseconds

export interface GeolocationData {
  latitude?: number;
  longitude?: number;
  address?: string;
  timestamp?: number;
}

export type GeolocationStatus = "checking" | "available" | "denied" | "unavailable" | null;
export type LocationPermissionStatus = "granted" | "denied" | "prompt" | "unavailable" | null;

export function useGeolocation(captureEmployeeLocation: boolean) {
  const [geolocation, setGeolocation] = useState<GeolocationData>({});
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [geolocationStatus, setGeolocationStatus] = useState<GeolocationStatus>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<LocationPermissionStatus>(null);

  // Use ref to track latest geolocation for checking in async contexts
  const geolocationRef = useRef(geolocation);
  useEffect(() => {
    geolocationRef.current = geolocation;
  }, [geolocation]);

  // Check geolocation permission status on mount
  useEffect(() => {
    if (!captureEmployeeLocation) return;

    const checkLocationPermission = async () => {
      if (!navigator.geolocation) {
        setLocationPermissionStatus("unavailable");
        return;
      }

      if ('permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          setLocationPermissionStatus(permissionStatus.state as "granted" | "denied" | "prompt");
          
          permissionStatus.onchange = () => {
            setLocationPermissionStatus(permissionStatus.state as "granted" | "denied" | "prompt");
          };
        } catch (error) {
          console.warn("Permissions API not fully supported, falling back to geolocation check:", error);
          checkLocationPermissionFallback();
        }
      } else {
        checkLocationPermissionFallback();
      }
    };

    const checkLocationPermissionFallback = () => {
      navigator.geolocation.getCurrentPosition(
        () => setLocationPermissionStatus("granted"),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermissionStatus("denied");
          } else {
            setLocationPermissionStatus("prompt");
          }
        },
        { timeout: 100, maximumAge: 0 }
      );
    };

    checkLocationPermission();
  }, [captureEmployeeLocation]);

  const getCurrentLocation = useCallback(async (forceRefresh: boolean = false): Promise<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null> => {
    // Check if we have cached geolocation that's still valid
    if (!forceRefresh && geolocation.latitude && geolocation.longitude && geolocation.timestamp) {
      const age = Date.now() - geolocation.timestamp;
      const canUseCache = age < LOCATION_CACHE_DURATION && 
        (locationPermissionStatus === "granted" || geolocationStatus === "available" || geolocationStatus === null);
      
      if (canUseCache) {
        console.log(`Using cached geolocation (age: ${Math.round(age / 1000)}s, permission: ${locationPermissionStatus}):`, geolocation);
        return {
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
          address: geolocation.address,
        };
      }
    } else if (!forceRefresh && geolocation.latitude && geolocation.longitude) {
      if (locationPermissionStatus === "granted") {
        console.log("Using cached geolocation (no timestamp, but permission granted):", geolocation);
        return {
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
          address: geolocation.address,
        };
      }
    }

    // Prevent concurrent calls
    if (isGettingLocation) {
      console.log("Geolocation request already in progress, waiting...");
      let attempts = 0;
      while (isGettingLocation && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        if (geolocation.latitude && geolocation.longitude) {
          console.log("Got geolocation while waiting:", geolocation);
          return {
            latitude: geolocation.latitude,
            longitude: geolocation.longitude,
            address: geolocation.address,
          };
        }
      }
      if (geolocation.latitude && geolocation.longitude) {
        return {
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
          address: geolocation.address,
        };
      }
      return null;
    }

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation is not supported by your browser");
        setGeolocationStatus("unavailable");
        setGeolocationError("Geolocation is not supported by your browser");
        resolve(null);
        return;
      }

      setIsGettingLocation(true);
      console.log("Requesting geolocation (new request)...");
      setGeolocationStatus("checking");

      try {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              console.log("Geolocation success:", { latitude, longitude });

              let address: string | undefined;
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`,
                  {
                    headers: {
                      'User-Agent': 'HRMS Attendance System',
                    },
                  }
                );

                if (response.ok) {
                  const data = await response.json();
                  if (data.display_name) {
                    address = data.display_name;
                    console.log("Reverse geocoded address:", address);
                  }
                }
              } catch (error) {
                console.warn("Failed to reverse geocode:", error);
              }

              const geoData = { 
                latitude, 
                longitude, 
                address,
                timestamp: Date.now()
              };
              console.log("Final geoData (resolving promise):", geoData);
              setGeolocation(geoData);
              setGeolocationError(null);
              setGeolocationStatus("available");
              setLocationPermissionStatus("granted");
              setIsGettingLocation(false);
              resolve({ latitude, longitude, address });
            } catch (error) {
              console.error("Error processing geolocation:", error);
              setGeolocationStatus("unavailable");
              setGeolocationError("Error processing location data");
              setIsGettingLocation(false);
              resolve(null);
            }
          },
          (error) => {
            console.warn("Geolocation request result:", error);
            console.log("Error details:", {
              code: error?.code,
              message: error?.message,
              errorType: typeof error,
              errorKeys: error ? Object.keys(error) : [],
              errorString: JSON.stringify(error),
            });

            let errorMessage = "Failed to get location";
            
            if (error && typeof error === 'object' && 'code' in error) {
              const errorCode = error.code;
              
              switch (errorCode) {
                case 1:
                case error.PERMISSION_DENIED:
                  console.warn("Location permission denied by user");
                  setGeolocationStatus("denied");
                  setLocationPermissionStatus("denied");
                  errorMessage = "Location access denied. Please enable location access to mark attendance.";
                  break;
                case 2:
                case error.POSITION_UNAVAILABLE:
                  console.warn("Position unavailable - location service may be disabled or unavailable");
                  setGeolocationStatus("unavailable");
                  errorMessage = "Location information unavailable";
                  break;
                case 3:
                case error.TIMEOUT:
                  console.warn("Geolocation request timed out");
                  setGeolocationStatus("unavailable");
                  errorMessage = "Location request timed out";
                  break;
                default:
                  console.warn("Unknown geolocation error code:", errorCode);
                  setGeolocationStatus("unavailable");
                  errorMessage = error?.message || "Unable to determine location. Please try again.";
              }
            } else {
              console.warn("Geolocation error has unexpected structure:", error);
              setGeolocationStatus("unavailable");
              
              if (error && typeof error === 'object') {
                errorMessage = (error as any)?.message || (error as any)?.error?.message || "Failed to get location";
              } else if (typeof error === 'string') {
                errorMessage = error;
              } else {
                errorMessage = "Location access failed. Please check your browser settings and try again.";
              }
            }
            
            setGeolocationError(errorMessage);
            setIsGettingLocation(false);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
          }
        );
      } catch (unexpectedError) {
        console.error("Unexpected error setting up geolocation:", unexpectedError);
        setGeolocationStatus("unavailable");
        setGeolocationError("An unexpected error occurred while requesting location access");
        setIsGettingLocation(false);
        resolve(null);
      }
    });
  }, [isGettingLocation, geolocation, geolocationStatus, locationPermissionStatus]);

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
          toast.error("Location access denied. Please enable location permissions in your browser settings.");
        } else {
          setLocationPermissionStatus("prompt");
        }
      }
    } catch (error) {
      console.error("Error requesting location access:", error);
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
        console.log("Geolocation obtained after waiting:", {
          latitude: currentLat,
          longitude: currentLng,
          address: currentAddress,
          iteration: i + 1,
        });
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
    geolocationRef,
    getCurrentLocation,
    requestLocationAccess,
    waitForGeolocation,
    setGeolocation,
    setGeolocationError,
  };
}
