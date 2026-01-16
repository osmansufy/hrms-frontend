import { detectDevice } from "@/lib/utils/device-detection";
import { toast } from "sonner";
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
  geoData: { latitude: number; longitude: number; address?: string } | null
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
    console.log("Including geolocation in payload:", {
      latitude: payload.latitude,
      longitude: payload.longitude,
      address: payload.address,
    });
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

export async function getGeolocationForAttendance(
  captureEmployeeLocation: boolean,
  getCurrentLocation: (forceRefresh: boolean) => Promise<{ latitude: number; longitude: number; address?: string } | null>,
  waitForGeolocation: () => Promise<{ latitude: number; longitude: number; address?: string } | null>,
  geolocationRef: React.MutableRefObject<GeolocationData>,
  isSignOut: boolean = false
): Promise<{ latitude: number; longitude: number; address?: string } | null> {
  if (!captureEmployeeLocation) return null;

  let geoData: { latitude: number; longitude: number; address?: string } | null = null;

  try {
    geoData = await getCurrentLocation(isSignOut);
    console.log(`Geolocation result (initial):`, { geoData });

    // If geoData is null, wait a bit to see if geolocation becomes available
    if (!geoData) {
      console.log("geoData is null, waiting to see if geolocation becomes available...");
      geoData = await waitForGeolocation();
    }

    // Final fallback: check ref
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

    console.log(`Geolocation result (final):`, { geoData });
  } catch (error) {
    console.error("Error getting geolocation:", error);
    // Try to use cached geolocation if available
    const currentGeo = geolocationRef.current;
    if (currentGeo?.latitude && currentGeo?.longitude) {
      console.log("Using cached geolocation after error:", currentGeo);
      geoData = {
        latitude: currentGeo.latitude,
        longitude: currentGeo.longitude,
        address: currentGeo.address,
      };
    } else {
      toast.warning(
        "Unable to access your location. Attendance will be recorded without geolocation data."
      );
    }
  }

  return geoData;
}
