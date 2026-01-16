"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Calendar, TrendingUp, AlertCircle, Clock, CheckCircle, XCircle, Loader2, ClockAlert, CheckCircle2, LogOut, MapPin, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/components/auth/session-provider";
import { useUserBalances, useMyLeaves } from "@/lib/queries/leave";
import { LeavePieChart } from "./components/leave-pie-chart";
import { AttendanceBarChart } from "./components/attendance-bar-chart";
import { AttendancePieChart } from "./components/attendance-pie-chart";
import { LateAttendanceWarningModal } from "./components/late-attendance-warning-modal";
import { LateAttendanceConfirmationModal } from "./components/late-attendance-confirmation-modal";
import { LeaveDeductionRecords } from "./components/leave-deduction-records";
import { useMyAttendanceRecords } from "@/lib/queries/attendance";
import {
  useSignIn,
  useSignOut,
  useTodayAttendance,
  useMyLostHoursReport,
  useMonthlyLateCount,
} from "@/lib/queries/attendance";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LeaveBalance, LeaveRecord } from "@/lib/api/leave";
import { formatDateInDhaka, formatTimeInDhaka } from "@/lib/utils";
import {
  detectDevice,
  isDeviceAllowedForAttendance,
  getDeviceRestrictionMessage,
  DeviceType,
} from "@/lib/utils/device-detection";
import { useSystemSettings } from "@/lib/queries/system-settings";


// Helper function for calculating balance percentage
function calculateBalancePercentage(balance: LeaveBalance): number {
  const totalAllocated = balance.openingBalance + balance.carried || balance.openingBalance;
  const available = balance.available;
  return totalAllocated > 0 ? (available / totalAllocated) * 100 : 0;
}

export default function EmployeeDashboard() {

  // Session and userId
  const { session } = useSession();
  const userId = session?.user.id;

  // System settings (late threshold, mobile attendance, location capture)
  const { data: systemSettings } = useSystemSettings();
  const leaveDeductionDay = systemSettings?.leaveDeductionDay ?? 4;
  const allowMobileAttendance = systemSettings?.allowMobileAttendance ?? false;
  const captureEmployeeLocation =
    systemSettings?.captureEmployeeLocation ?? true;

  // Monthly late count
  const { data: monthlyLateCountData } = useMonthlyLateCount(userId);
  const monthlyLateCount = monthlyLateCountData?.lateCount ?? 0;

  // Modal states
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Attendance chart data for last 7 days
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - 6);
  const chartQueryParams = {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
    limit: "7",
  };
  const { data: attendanceChartData } = useMyAttendanceRecords(userId, chartQueryParams);
  const attendanceBarData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const dateStr = formatDateInDhaka(d, "short");
    const rec = attendanceChartData?.data?.find(r => {
      const recDate = new Date(r.date);
      return recDate.getUTCFullYear() === d.getUTCFullYear() && recDate.getUTCMonth() === d.getUTCMonth() && recDate.getUTCDate() === d.getUTCDate();
    });
    return {
      date: dateStr,
      present: rec?.signIn ? 1 : 0,
      late: rec?.isLate ? 1 : 0,
      absent: rec?.signIn ? 0 : 1,
    };
  });

  // Location state
  const [location, setLocation] = useState("");
  const [geolocation, setGeolocation] = useState<{
    latitude?: number;
    longitude?: number;
    address?: string;
    timestamp?: number; // Track when location was obtained
  }>({});
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [geolocationStatus, setGeolocationStatus] = useState<"checking" | "available" | "denied" | "unavailable" | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false); // Prevent concurrent calls
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<"granted" | "denied" | "prompt" | "unavailable" | null>(null);
  
  // Cache duration: use cached location if it's less than 3 minutes old (for sign-in)
  const LOCATION_CACHE_DURATION = 3 * 60 * 1000; // 3 minutes in milliseconds
  
  // Use ref to track latest geolocation for checking in async contexts
  // This allows us to access the latest geolocation value even in closures
  const geolocationRef = useRef(geolocation);
  // Update ref whenever geolocation state changes
  useEffect(() => {
    geolocationRef.current = geolocation;
  }, [geolocation]);

  // Device detection for attendance restriction
  const [deviceInfo, setDeviceInfo] = useState<ReturnType<typeof detectDevice> | null>(null);
  const [isDeviceAllowed, setIsDeviceAllowed] = useState(true);

  useEffect(() => {
    const device = detectDevice();
    setDeviceInfo(device);
    // If mobile attendance is allowed via system settings, we don't block on device
    if (allowMobileAttendance) {
      setIsDeviceAllowed(true);
    } else {
      setIsDeviceAllowed(isDeviceAllowedForAttendance());
    }
  }, [allowMobileAttendance]);

  // Check geolocation permission status on mount
  useEffect(() => {
    const checkLocationPermission = async () => {
      if (!navigator.geolocation) {
        setLocationPermissionStatus("unavailable");
        return;
      }

      // Try to use Permissions API if available (more modern browsers)
      if ('permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          setLocationPermissionStatus(permissionStatus.state as "granted" | "denied" | "prompt");
          
          // Listen for permission changes
          permissionStatus.onchange = () => {
            setLocationPermissionStatus(permissionStatus.state as "granted" | "denied" | "prompt");
          };
        } catch (error) {
          console.warn("Permissions API not fully supported, falling back to geolocation check:", error);
          // Fallback: try a quick geolocation check
          checkLocationPermissionFallback();
        }
      } else {
        // Fallback for browsers without Permissions API
        checkLocationPermissionFallback();
      }
    };

    const checkLocationPermissionFallback = () => {
      // Try to get current position with a very short timeout to check permission
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationPermissionStatus("granted");
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermissionStatus("denied");
          } else {
            setLocationPermissionStatus("prompt");
          }
        },
        {
          timeout: 100,
          maximumAge: 0,
        }
      );
    };

    if (captureEmployeeLocation) {
      checkLocationPermission();
    }
  }, [captureEmployeeLocation]);



  // Function to get current geolocation
  const getCurrentLocation = useCallback(async (forceRefresh: boolean = false): Promise<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null> => {
    // Check if we have cached geolocation that's still valid (not forcing refresh)
    if (!forceRefresh && geolocation.latitude && geolocation.longitude && geolocation.timestamp) {
      const age = Date.now() - geolocation.timestamp;
      // Use cached location if:
      // 1. It's less than cache duration old, AND
      // 2. Permission is granted OR status is available (more lenient check)
      // More lenient cache check: use cache if permission is granted, even if status isn't set yet
      const canUseCache = age < LOCATION_CACHE_DURATION && 
        (locationPermissionStatus === "granted" || geolocationStatus === "available" || geolocationStatus === null);
      
      if (canUseCache) {
        console.log(`Using cached geolocation (age: ${Math.round(age / 1000)}s, permission: ${locationPermissionStatus}):`, geolocation);
        return {
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
          address: geolocation.address,
        };
      } else {
        if (age >= LOCATION_CACHE_DURATION) {
          console.log(`Cached geolocation is too old (age: ${Math.round(age / 1000)}s), requesting new location`);
        } else {
          console.log(`Cached geolocation exists but permission status is not ready (status: ${geolocationStatus}, permission: ${locationPermissionStatus}), requesting new location`);
        }
      }
    } else if (!forceRefresh && geolocation.latitude && geolocation.longitude) {
      // If we have location but no timestamp, still try to use it if permission is granted
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
      // Wait for the current request to complete
      let attempts = 0;
      while (isGettingLocation && attempts < 30) { // Wait up to 3 seconds
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        // If we got geolocation while waiting, return it
        if (geolocation.latitude && geolocation.longitude) {
          console.log("Got geolocation while waiting:", geolocation);
          return {
            latitude: geolocation.latitude,
            longitude: geolocation.longitude,
            address: geolocation.address,
          };
        }
      }
      // If still in progress or no data, return cached or null
      if (geolocation.latitude && geolocation.longitude) {
        return {
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
          address: geolocation.address,
        };
      }
      return null;
    }

    return new Promise((resolve, reject) => {
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
      
      // Wrap in try-catch to handle any unexpected errors during getCurrentPosition call
      try {

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            console.log("Geolocation success:", { latitude, longitude });

            // Try to reverse geocode to get address
            let address: string | undefined;
            try {
              // Using OpenStreetMap Nominatim API (free, no API key required)
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`,
                {
                  headers: {
                    'User-Agent': 'HRMS Attendance System', // Required by Nominatim
                  },
                }
              );

              if (response.ok) {
                const data = await response.json();
                if (data.display_name) {
                  address = data.display_name;
                  console.log("Reverse geocoded address:", address);
                }
              } else {
                console.warn("Reverse geocoding failed:", response.status);
              }
            } catch (error) {
              console.warn("Failed to reverse geocode:", error);
              // Continue without address
            }

            const geoData = { 
              latitude, 
              longitude, 
              address,
              timestamp: Date.now() // Store timestamp when location was obtained
            };
            console.log("Final geoData (resolving promise):", geoData);
            setGeolocation(geoData);
            setGeolocationError(null);
            setGeolocationStatus("available");
            setLocationPermissionStatus("granted"); // Update permission status when location is successfully obtained
            setIsGettingLocation(false);
            resolve({ latitude, longitude, address });
          } catch (error) {
            console.error("Error processing geolocation:", error);
            setGeolocationStatus("unavailable");
            setGeolocationError("Error processing location data");
            setIsGettingLocation(false);
            reject(error);
          }
        },
        (error) => {
          // Enhanced error handling for various error scenarios
          // Log as warning first, then determine severity based on error type
          console.warn("Geolocation request result:", error);
          console.log("Error details:", {
            code: error?.code,
            message: error?.message,
            errorType: typeof error,
            errorKeys: error ? Object.keys(error) : [],
            errorString: JSON.stringify(error),
          });

          let errorMessage = "Failed to get location";
          
          // Check if error has a code property (standard GeolocationPositionError)
          if (error && typeof error === 'object' && 'code' in error) {
            // Use numeric codes for comparison (more reliable than named constants)
            const errorCode = error.code;
            
            switch (errorCode) {
              case 1: // PERMISSION_DENIED
              case error.PERMISSION_DENIED:
                // Permission denied is an expected user state, not an error
                console.warn("Location permission denied by user");
                setGeolocationStatus("denied");
                setLocationPermissionStatus("denied");
                errorMessage = "Location access denied. Please enable location access to mark attendance.";
                break;
              case 2: // POSITION_UNAVAILABLE
              case error.POSITION_UNAVAILABLE:
                console.warn("Position unavailable - location service may be disabled or unavailable");
                setGeolocationStatus("unavailable");
                errorMessage = "Location information unavailable";
                break;
              case 3: // TIMEOUT
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
            // Handle cases where error doesn't have expected structure
            console.warn("Geolocation error has unexpected structure:", error);
            setGeolocationStatus("unavailable");
            
            // Try to extract message from error if available
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
          resolve(null); // Resolve with null instead of rejecting to allow sign-in without location
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout to 15 seconds
          maximumAge: 60000, // Accept cached position up to 1 minute old
        }
      );
      } catch (unexpectedError) {
        // Handle any unexpected errors during the getCurrentPosition setup
        console.error("Unexpected error setting up geolocation:", unexpectedError);
        setGeolocationStatus("unavailable");
        setGeolocationError("An unexpected error occurred while requesting location access");
        setIsGettingLocation(false);
        resolve(null);
      }
    });
  }, [isGettingLocation, geolocation, geolocationStatus, LOCATION_CACHE_DURATION]);

  // Function to request location access
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
        // Check status after the call
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

  // Attendance queries
  const { data: todayAttendance, isLoading: attendanceLoading, isFetching: attendanceFetching } = useTodayAttendance(userId);


  // Live worked hours clock
  const [workedSeconds, setWorkedSeconds] = useState(0);
  const todayDate = formatDateInDhaka(new Date(), "long");
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (todayAttendance?.signIn && !todayAttendance?.signOut) {
      const signIn = new Date(todayAttendance.signIn);
      interval = setInterval(() => {
        setWorkedSeconds(Math.floor((Date.now() - signIn.getTime()) / 1000));
      }, 1000);
      // Set initial value
      setWorkedSeconds(Math.floor((Date.now() - signIn.getTime()) / 1000));
    } else if (todayAttendance?.signIn && todayAttendance?.signOut) {
      const signIn = new Date(todayAttendance.signIn);
      const signOut = new Date(todayAttendance.signOut);
      setWorkedSeconds(Math.floor((signOut.getTime() - signIn.getTime()) / 1000));
    } else {
      setWorkedSeconds(0);
    }
    return () => interval && clearInterval(interval);
  }, [todayAttendance?.signIn, todayAttendance?.signOut]);

  function formatWorkedTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }


  // Pie chart data for monthly leaves
  const { data: leaves } = useMyLeaves(userId);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyLeaves = (leaves || []).filter(l => {
    const start = new Date(l.startDate);
    return start.getMonth() === currentMonth && start.getFullYear() === currentYear;
  });
  const leaveTypeMap: Record<string, { name: string; value: number; color: string }> = {};
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c", "#d0ed57", "#fa8072"];
  let colorIdx = 0;
  for (const leave of monthlyLeaves) {
    const type = leave.leaveType?.name || "Other";
    if (!leaveTypeMap[type]) {
      leaveTypeMap[type] = { name: type, value: 0, color: colors[colorIdx % colors.length] };
      colorIdx++;
    }
    leaveTypeMap[type].value += 1;
  }
  const pieData = Object.values(leaveTypeMap);


  const signInMutation = useSignIn(userId);
  const signOutMutation = useSignOut(userId);

  // Lost hours report for last 7 days
  const start7 = new Date();
  start7.setDate(start7.getDate() - 7);
  const { data: lostHoursData } = useMyLostHoursReport(userId, {
    startDate: start7.toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });
  const myLostHours = lostHoursData?.[0]; // Employee endpoint returns array with single item

  // Memoize attendance status
  const attendanceStatus = useMemo(() => {
    if (attendanceLoading) return "Checking status…";
    if (!todayAttendance) return "Not signed in";
    if (todayAttendance.signOut) return "Signed out";
    return "Signed in";
  }, [todayAttendance, attendanceLoading]);

  // Attendance handlers
  const performSignIn = useCallback(async () => {
    // Check device before attempting sign-in
    if (!isDeviceAllowedForAttendance()) {
      const device = detectDevice();
      toast.error(getDeviceRestrictionMessage(device.type));
      return;
    }

    // Get geolocation - wait for it to complete (only if enabled in settings)
    console.log("Getting geolocation for sign-in...");
    let geoData: { latitude: number; longitude: number; address?: string } | null = null;

    if (captureEmployeeLocation) {
      try {
        // For sign-in, use cached location if available and recent (within 3 minutes)
        // This allows using location obtained from "Grant Access" button
        geoData = await getCurrentLocation(false); // false = allow using cached location
        console.log("Geolocation result for sign-in (initial):", {
          geoData,
          geolocationStatus,
        });
        
        // If geoData is null (e.g., permission was initially denied but user might grant it),
        // wait a bit and check if geolocation state was updated (user might have granted permission)
        if (!geoData) {
          const initialStatus = geolocationStatus;
          console.log("geoData is null, initial status:", initialStatus, "waiting to see if geolocation becomes available...");
          // Wait up to 3 seconds for geolocation to become available (increased from 2 seconds)
          for (let i = 0; i < 30; i++) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            // Check ref which always has the latest geolocation value
            const currentGeo = geolocationRef.current;
            const currentLat = currentGeo?.latitude;
            const currentLng = currentGeo?.longitude;
            const currentAddress = currentGeo?.address;
            
            // Check if geolocation was obtained - use ref to get latest value
            if (currentLat && currentLng) {
              console.log("Geolocation obtained after waiting (user granted permission):", {
                latitude: currentLat,
                longitude: currentLng,
                address: currentAddress,
                iteration: i + 1,
              });
              geoData = {
                latitude: currentLat,
                longitude: currentLng,
                address: currentAddress,
              };
              break;
            }
          }
        }
        
        // Final fallback: if geoData is still null but we have cached geolocation in ref, use it
        if (!geoData) {
          const currentGeo = geolocationRef.current;
          if (currentGeo?.latitude && currentGeo?.longitude) {
            console.log("Using cached geolocation from ref (final fallback):", currentGeo);
            geoData = {
              latitude: currentGeo.latitude,
              longitude: currentGeo.longitude,
              address: currentGeo.address,
            };
          }
        }
        
        console.log("Geolocation result for sign-in (final):", {
          geoData,
          geolocationStatus,
          locationPermissionStatus,
        });
      } catch (error) {
        console.error("Error getting geolocation for sign-in:", error);
        // Try to use cached geolocation if available
        if (!geoData && geolocation.latitude && geolocation.longitude) {
          console.log("Using cached geolocation after error:", geolocation);
          geoData = {
            latitude: geolocation.latitude,
            longitude: geolocation.longitude,
            address: geolocation.address, 
          };
        } else {
          toast.warning(
            "Unable to access your location. Attendance will be recorded without geolocation data."
          );
        }
      }
    
    }

    // Get device info to send screen/touch metadata for enhanced validation
    const deviceInfo = detectDevice();
    const payload: {
      location?: string;
      latitude?: number;
      longitude?: number;
      address?: string;
      screenWidth?: number;
      screenHeight?: number;
      hasTouchScreen?: boolean;
    } = {
      location: location || undefined,
    };

    // Include geolocation data if available
    if (geoData) {
      payload.latitude = geoData.latitude;
      payload.longitude = geoData.longitude;
      if (geoData.address) {
        payload.address = geoData.address;
      }
      console.log("Including geolocation in sign-in payload:", {
        latitude: payload.latitude,
        longitude: payload.longitude,
        address: payload.address,
      });
    } else {
      console.warn("No geolocation data to include in sign-in payload");
    }

    // Include screen/touch info if available (for backend validation)
    if (deviceInfo.screenWidth !== undefined) {
      payload.screenWidth = deviceInfo.screenWidth;
    }
    if (deviceInfo.screenHeight !== undefined) {
      payload.screenHeight = deviceInfo.screenHeight;
    }
    if (deviceInfo.hasTouchScreen !== undefined) {
      payload.hasTouchScreen = deviceInfo.hasTouchScreen;
    }

    console.log("Final payload before API call:", payload);
    try {
      const result = await signInMutation.mutateAsync(payload);
      toast.success("Signed in successfully");
      setLocation("");
      // Keep geolocation cached for potential reuse (don't clear it)
      // Only clear error status
      setGeolocationError(null);

      // Check for late attendance flags
      if ((result as any)?.leaveDeducted) {
        setShowConfirmationModal(true);
        toast.info("1 day of casual leave has been deducted for late attendance");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      // Check if error is device-related
      if (err?.response?.status === 403 || err?.message?.includes("desktop") || err?.message?.includes("laptop")) {
        toast.error(err?.response?.data?.message || "Attendance is only allowed from desktop or laptop computers.");
      } else if (err?.code === "ERR_NETWORK" || err?.message?.includes("Network Error")) {
        toast.error("Network error: Please check if the backend server is running and accessible.");
      } else if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(err?.message || "Sign-in failed. Please try again.");
      }
    }
  }, [signInMutation, location, getCurrentLocation, geolocationStatus, geolocation]);

  const handleSignIn = useCallback(async () => {
    // Check if late count is (leaveDeductionDay - 1) - show warning modal before sign-in
    if (monthlyLateCount === leaveDeductionDay - 1) {
      setShowWarningModal(true);
      return;
    }

    // Proceed with sign-in
    await performSignIn();
  }, [monthlyLateCount, leaveDeductionDay, performSignIn]);

  // Handle warning modal confirmation - proceed with sign-in
  const handleWarningModalConfirm = useCallback(() => {
    setShowWarningModal(false);
    performSignIn();
  }, [performSignIn]);

  const handleSignOut = useCallback(async () => {
    // Check device before attempting sign-out
    if (!isDeviceAllowedForAttendance()) {
      const device = detectDevice();
      toast.error(getDeviceRestrictionMessage(device.type));
      return;
    }

    // Get geolocation (only if enabled in settings)
    console.log("Getting geolocation for sign-out...");
    let geoData: { latitude: number; longitude: number; address?: string } | null = null;
    if (captureEmployeeLocation) {
      try {
        // For sign-out, always get fresh location since user might have moved
        geoData = await getCurrentLocation(true); // true = force refresh to get current location
        console.log("Geolocation result for sign-out (initial):", {
          geoData,
          geolocationStatus,
        });
        
        // If geoData is null (e.g., permission was initially denied but user might grant it),
        // wait a bit and check if geolocation state was updated
        if (!geoData) {
          const initialStatus = geolocationStatus;
          console.log("geoData is null for sign-out, initial status:", initialStatus, "waiting to see if geolocation becomes available...");
          // Wait up to 3 seconds for geolocation to become available (increased from 2 seconds)
          for (let i = 0; i < 30; i++) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            // Check ref which always has the latest geolocation value
            const currentGeo = geolocationRef.current;
            const currentLat = currentGeo?.latitude;
            const currentLng = currentGeo?.longitude;
            const currentAddress = currentGeo?.address;
            
            // Check if geolocation was obtained - use ref to get latest value
            if (currentLat && currentLng) {
              console.log("Geolocation obtained after waiting (user granted permission):", {
                latitude: currentLat,
                longitude: currentLng,
                address: currentAddress,
                iteration: i + 1,
              });
              geoData = {
                latitude: currentLat,
                longitude: currentLng,
                address: currentAddress,
              };
              break;
            }
          }
        }
        
        // Final fallback: if geoData is still null but we have cached geolocation in ref, use it
        if (!geoData) {
          const currentGeo = geolocationRef.current;
          if (currentGeo?.latitude && currentGeo?.longitude) {
            console.log("Using cached geolocation from ref (final fallback):", currentGeo);
            geoData = {
              latitude: currentGeo.latitude,
              longitude: currentGeo.longitude,
              address: currentGeo.address,
            };
          }
        }
        
        console.log("Geolocation result for sign-out (final):", {
          geoData,
          geolocationStatus,
          locationPermissionStatus,
        });
      } catch (error) {
        console.error("Error getting geolocation for sign-out:", error);
        // Try to use cached geolocation if available
        if (!geoData && geolocation.latitude && geolocation.longitude) {
          console.log("Using cached geolocation after error:", geolocation);
          geoData = {
            latitude: geolocation.latitude,
            longitude: geolocation.longitude,
            address: geolocation.address,
          };
        } else {
          toast.warning(
            "Unable to access your location. Attendance will be recorded without geolocation data."
          );
        }
      }

      // Warn if geolocation is not available
      if (!geoData && geolocationStatus === "denied") {
        toast.error(
          "Geolocation access is required. Please enable location permissions to mark attendance."
        );
        return;
      } else if (!geoData && geolocationStatus === "unavailable") {
        toast.warning(
          "Unable to access your location. Attendance will be recorded without geolocation data."
        );
      }
    }

    // Get device info to send screen/touch metadata for enhanced validation
    const deviceInfo = detectDevice();
    const payload: {
      location?: string;
      latitude?: number;
      longitude?: number;
      address?: string;
      screenWidth?: number;
      screenHeight?: number;
      hasTouchScreen?: boolean;
    } = {
      location: location || undefined,
    };

    // Include geolocation data if available
    if (geoData) {
      payload.latitude = geoData.latitude;
      payload.longitude = geoData.longitude;
      if (geoData.address) {
        payload.address = geoData.address;
      }
      console.log("Including geolocation in sign-out payload:", {
        latitude: payload.latitude,
        longitude: payload.longitude,
        address: payload.address,
      });
    } else {
      console.warn("No geolocation data to include in sign-out payload");
    }

    // Include screen/touch info if available (for backend validation)
    if (deviceInfo.screenWidth !== undefined) {
      payload.screenWidth = deviceInfo.screenWidth;
    }
    if (deviceInfo.screenHeight !== undefined) {
      payload.screenHeight = deviceInfo.screenHeight;
    }
    if (deviceInfo.hasTouchScreen !== undefined) {
      payload.hasTouchScreen = deviceInfo.hasTouchScreen;
    }

    console.log("Final sign-out payload before API call:", payload);
    try {
      await signOutMutation.mutateAsync(payload);
      toast.success("Signed out successfully");
      setLocation("");
      // Clear geolocation after sign-out since we got fresh location
      // This ensures next sign-in will get fresh location if needed
      setGeolocation({});
      setGeolocationError(null);
    } catch (err: any) {
      console.error("Sign-out error:", err);
      // Check if error is device-related
      if (err?.response?.status === 403 || err?.message?.includes("desktop") || err?.message?.includes("laptop")) {
        toast.error(err?.response?.data?.message || "Attendance is only allowed from desktop or laptop computers.");
      } else if (err?.code === "ERR_NETWORK" || err?.message?.includes("Network Error")) {
        toast.error("Network error: Please check if the backend server is running and accessible.");
      } else if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(err?.message || "Sign-out failed. Please try again.");
      }
    }
  }, [signOutMutation, location, getCurrentLocation, geolocationStatus]);

  // Leave-related queries and calculations removed from dashboard (now only on leave page)

  // Leave status icon/badge helpers removed from dashboard

  return (
    <div className="container space-y-6">
      <div className="flex justify-between items-center mb-2">
        <Badge variant="outline" className="text-base px-4 py-2  from-blue-50 to-indigo-50 border-blue-400 text-blue-900 font-semibold tracking-wide rounded-full">
          {`Keep pushing! Your productivity matters${session?.user?.name ? ", " + session.user.name : ""}. 🚀`}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-4 items-center justify-end">
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground">Date</span>
          <span className="font-medium">{todayDate}</span>
        </div>
        <div className="flex flex-col items-end px-4 py-3 rounded-lg  from-green-100 to-emerald-100 border-2 border-green-400 shadow-md hover:shadow-lg transition-shadow">
          <span className="text-xs font-semibold text-green-700 uppercase tracking-widest">⏱️ Live Work Time</span>
          <span className="font-mono text-2xl font-bold text-green-700">{formatWorkedTime(workedSeconds)}</span>
        </div>
      </div>
      <div className="flex justify-end">
        <Link href="/dashboard/employee/attendance/reconciliation">
          <Button variant="secondary">Attendance Reconciliation</Button>
        </Link>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-semibold">Your Dashboard</h1>
        </div>
      </div>


      {/* Monthly Late Count */}
      {monthlyLateCount > 0 && (
        <Card className={cn(
          "border-2",
          monthlyLateCount >= 3 ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" : "border-orange-200"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClockAlert className={cn(
                  "h-5 w-5",
                  monthlyLateCount >= 3 ? "text-yellow-600" : "text-orange-600"
                )} />
                <div>
                  <p className="text-sm font-medium">Monthly Late Count</p>
                  <p className="text-xs text-muted-foreground">
                    {monthlyLateCount >= leaveDeductionDay - 1
                      ? `Warning: One more late will reach the configured leave deduction threshold (${leaveDeductionDay})`
                      : `Keep track of your attendance. Leave is deducted starting from the ${leaveDeductionDay}th late in a month.`}
                  </p>
                </div>
              </div>
              <Badge
                variant={monthlyLateCount >= 3 ? "destructive" : "secondary"}
                className="text-lg px-4 py-1"
              >
                {monthlyLateCount} /month
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Attendance</h2>
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

            {/* Location Permission Status - Show when location capture is enabled */}
            {captureEmployeeLocation && locationPermissionStatus !== null && (
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
                      onClick={requestLocationAccess}
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
            )}

            {/* Geolocation Status Alert - Only shown when getting location during sign-in/sign-out */}
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
                {/* Time Display - More Prominent */}
                {(todayAttendance?.signIn || todayAttendance?.signOut) && (
                  <div className="flex items-center gap-5 mb-5 text-sm">
                    {todayAttendance?.signIn && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                        <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                        <span className="text-muted-foreground">In:</span>
                        <span className="font-semibold text-green-700 dark:text-green-300">{formatTimeInDhaka(todayAttendance.signIn)}</span>
                      </div>
                    )}
                    {todayAttendance?.signOut && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800">
                        <LogOut className="size-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-muted-foreground">Out:</span>
                        <span className="font-semibold text-orange-700 dark:text-orange-300">{formatTimeInDhaka(todayAttendance.signOut)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Circular Toggle Button */}
                <Button
                  onClick={!todayAttendance?.signIn ? handleSignIn : handleSignOut}
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

                {/* Button Label with Better Typography */}
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
                onChange={(e) => setLocation(e.target.value)}
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
      </div>

      {/* Attendance Chart Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Attendance Overview</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Weekly Attendance Bar Chart */}
          <div>
            <AttendanceBarChart data={attendanceBarData} />
          </div>

          {/* Monthly Attendance Pie Chart */}
          <div>
            <AttendancePieChart />
          </div>
        </div>
      </div>



      {/* Late Attendance Modals */}
      <LateAttendanceWarningModal
        open={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleWarningModalConfirm}
        lateCount={monthlyLateCount}
      />

      <LateAttendanceConfirmationModal
        open={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        lateCount={monthlyLateCount}
      />

    </div>
  );
}
