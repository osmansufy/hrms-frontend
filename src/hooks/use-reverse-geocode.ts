import { useQuery } from "@tanstack/react-query";

const REVERSE_GEOCODE_CACHE_MS = 60 * 60 * 1000; // 1 hour

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`,
    {
      headers: { "User-Agent": "HRMS Admin Attendance Dashboard" },
    },
  );

  if (!response.ok) return null;
  const data = await response.json();
  return typeof data.display_name === "string" ? data.display_name : null;
}

export function useReverseGeocode(
  latitude?: number | null,
  longitude?: number | null,
  enabled: boolean = true,
) {
  const hasCoords = latitude != null && longitude != null;

  return useQuery({
    queryKey: ["reverseGeocode", latitude, longitude],
    enabled: enabled && hasCoords,
    staleTime: REVERSE_GEOCODE_CACHE_MS,
    queryFn: async () => {
      if (!hasCoords) return null;
      return reverseGeocode(latitude as number, longitude as number);
    },
  });
}

