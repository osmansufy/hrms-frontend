import { detectDevice } from "@/lib/utils/device-detection";
import type { GeolocationData } from "../hooks/use-geolocation";
import type React from "react";

export interface AttendancePayload {
  location?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  screenWidth?: number;
  screenHeight?: number;
  hasTouchScreen?: boolean;
}

export async function buildAttendancePayload(
  location: string,
  geoData: { latitude: number; longitude: number; address?: string } | null,
): Promise<AttendancePayload> {
  const deviceInfo = detectDevice();
  const payload: AttendancePayload = {
    location: location || undefined,
  };

  // Include geolocation data if available
  if (geoData) {
    payload.latitude = geoData.latitude;
    payload.longitude = geoData.longitude;
    if (geoData.address) {
      payload.address = geoData.address;
    }
  } else {
    console.warn("No geolocation data to include in payload");
  }

  // Include screen/touch info if available
  if (deviceInfo.screenWidth !== undefined) {
    payload.screenWidth = deviceInfo.screenWidth;
  }
  if (deviceInfo.screenHeight !== undefined) {
    payload.screenHeight = deviceInfo.screenHeight;
  }
  if (deviceInfo.hasTouchScreen !== undefined) {
    payload.hasTouchScreen = deviceInfo.hasTouchScreen;
  }

  return payload;
}

/**
 * Optimized geolocation retrieval for attendance.
 *
 * Since we now use watchPosition to proactively update location when permission is granted,
 * this function should return cached data quickly in most cases. The fallbacks are:
 * 1. getCurrentLocation - returns cached data from watchPosition or fetches fresh
 * 2. waitForGeolocation - waits up to 3s for location to become available
 * 3. geolocationRef - direct access to cached coordinates
 *
 * @param captureEmployeeLocation - Whether location capture is enabled
 * @param getCurrentLocation - Hook function to get current location
 * @param waitForGeolocation - Hook function to wait for location availability
 * @param geolocationRef - Ref to cached geolocation data
 * @param isSignOut - If true, forces a fresh location fetch (for sign-out accuracy)
 */
export async function getGeolocationForAttendance(
  captureEmployeeLocation: boolean,
  getCurrentLocation: (
    forceRefresh: boolean,
  ) => Promise<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>,
  waitForGeolocation: () => Promise<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>,
  geolocationRef: React.MutableRefObject<GeolocationData>,
  isSignOut: boolean = false,
): Promise<{ latitude: number; longitude: number; address?: string } | null> {
  // Early return if location capture is disabled
  if (!captureEmployeeLocation) return null;

  try {
    // For sign-out, force a fresh location fetch for accuracy
    // For sign-in, use cached location from watchPosition (should be available instantly)
    const geoData = await getCurrentLocation(isSignOut);

    if (geoData) {
      return geoData;
    }

    // Fallback 1: Wait for geolocation to become available (up to 3s)
    const waitedGeoData = await waitForGeolocation();

    if (waitedGeoData) {
      return waitedGeoData;
    }

    // Fallback 2: Check ref directly for any cached coordinates
    const cachedGeo = geolocationRef.current;
    if (cachedGeo?.latitude && cachedGeo?.longitude) {
      return {
        latitude: cachedGeo.latitude,
        longitude: cachedGeo.longitude,
        address: cachedGeo.address,
      };
    }

    // No location available
    console.warn("Unable to obtain geolocation after all attempts");
    return null;
  } catch (error) {
    console.error("Error getting geolocation:", error);

    // Last resort: check ref for cached data
    const cachedGeo = geolocationRef.current;
    if (cachedGeo?.latitude && cachedGeo?.longitude) {
      return {
        latitude: cachedGeo.latitude,
        longitude: cachedGeo.longitude,
        address: cachedGeo.address,
      };
    }

    return null;
  }
}
