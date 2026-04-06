// cspell:ignore geolocation watchposition clearwatch
/**
 * useGeolocation — hook tests (jest + jsdom)
 *
 * NOTE: This is NOT a true E2E test. True E2E (real GPS + browser) requires
 * Playwright with navigator.geolocation override — the project does not have
 * Playwright configured. These tests cover every hook code path via mocked
 * browser APIs (navigator.geolocation + navigator.permissions).
 *
 * Run: pnpm test -- use-geolocation
 *
 * Regression coverage:
 *   HIGH-1  — 0,0 coordinates treated as valid (not falsy)
 *   HIGH-2  — auto-prompt grant starts watchPosition
 *   MEDIUM-1 — concurrent getCurrentLocation calls share one request
 *   LOW-5   — enableHighAccuracy:false fallback on timeout
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useGeolocation } from "./use-geolocation";
import { toast } from "sonner";

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const pos = (lat: number, lng: number): GeolocationPosition =>
  ({
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: 1_000_000,
  } as unknown as GeolocationPosition);

const geoErr = (code: 1 | 2 | 3): GeolocationPositionError =>
  ({
    code,
    message: ["", "Permission denied", "Position unavailable", "Timeout"][code],
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as unknown as GeolocationPositionError);

// ─── Per-test mock state ──────────────────────────────────────────────────────

// Queue of getCurrentPosition invocations — tests trigger callbacks manually
const currPosCalls: Array<{
  success: PositionCallback;
  error: PositionErrorCallback;
  options?: PositionOptions;
}> = [];

let watchSuccessCb: PositionCallback | null = null;
let watchErrorCb: PositionErrorCallback | null = null;
let watchCallCount = 0;

// Permission status mock — mutate .state / call .onchange in tests
const permStatus = {
  state: "granted" as PermissionState,
  onchange: null as ((ev?: Event) => void) | null,
};

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers();

  currPosCalls.length = 0;
  watchSuccessCb = null;
  watchErrorCb = null;
  watchCallCount = 0;
  permStatus.state = "granted";
  permStatus.onchange = null;

  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: jest.fn(
        (
          success: PositionCallback,
          error: PositionErrorCallback,
          opts?: PositionOptions,
        ) => {
          currPosCalls.push({ success, error, options: opts });
        },
      ),
      watchPosition: jest.fn(
        (success: PositionCallback, error: PositionErrorCallback) => {
          watchSuccessCb = success;
          watchErrorCb = error;
          return ++watchCallCount;
        },
      ),
      clearWatch: jest.fn(() => {
        watchSuccessCb = null;
        watchErrorCb = null;
      }),
    },
  });

  Object.defineProperty(navigator, "permissions", {
    configurable: true,
    value: { query: jest.fn().mockResolvedValue(permStatus) },
  });
});

afterEach(() => {
  jest.useRealTimers();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Flush Promises so async useEffect code (permissions.query await) settles */
async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
  });
}

/** Advance fake timers and flush resulting microtasks */
async function advanceBy(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useGeolocation", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // captureEmployeeLocation: false
  // ───────────────────────────────────────────────────────────────────────────
  describe("captureEmployeeLocation: false", () => {
    it("makes no geolocation or permissions calls", async () => {
      renderHook(() => useGeolocation(false));
      await flushAsync();

      expect(navigator.geolocation.watchPosition).not.toHaveBeenCalled();
      expect(navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
      expect(navigator.permissions.query).not.toHaveBeenCalled();
    });

    it("isLocationReady is true (location not required)", () => {
      const { result } = renderHook(() => useGeolocation(false));
      expect(result.current.isLocationReady).toBe(true);
    });

    it("isLocationBlocked is false", () => {
      const { result } = renderHook(() => useGeolocation(false));
      expect(result.current.isLocationBlocked).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // navigator.geolocation unavailable
  // ───────────────────────────────────────────────────────────────────────────
  describe("navigator.geolocation unavailable", () => {
    beforeEach(() => {
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: undefined,
      });
    });

    it("sets locationPermissionStatus to 'unavailable'", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      await waitFor(() => {
        expect(result.current.locationPermissionStatus).toBe("unavailable");
      });
    });

    it("isLocationBlocked is true", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      await waitFor(() => {
        expect(result.current.isLocationBlocked).toBe(true);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Permission: granted
  // ───────────────────────────────────────────────────────────────────────────
  describe("permission: granted", () => {
    it("sets locationPermissionStatus to 'granted'", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      expect(result.current.locationPermissionStatus).toBe("granted");
    });

    it("starts watchPosition immediately on mount", async () => {
      renderHook(() => useGeolocation(true));
      await flushAsync();

      expect(navigator.geolocation.watchPosition).toHaveBeenCalledTimes(1);
    });

    it("does NOT start a second watchPosition if one is already active", async () => {
      renderHook(() => useGeolocation(true));
      await flushAsync();

      // Simulates onchange firing while already watching
      act(() => {
        permStatus.state = "granted";
        permStatus.onchange?.();
      });

      expect(navigator.geolocation.watchPosition).toHaveBeenCalledTimes(1);
    });

    it("updates geolocation state when watchPosition fires", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      act(() => {
        watchSuccessCb!(pos(51.5, -0.1));
      });

      expect(result.current.geolocation.latitude).toBe(51.5);
      expect(result.current.geolocation.longitude).toBe(-0.1);
      expect(result.current.geolocationStatus).toBe("available");
    });

    it("clears geolocationError when watchPosition succeeds", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      act(() => {
        watchSuccessCb!(pos(51.5, -0.1));
      });

      expect(result.current.geolocationError).toBeNull();
    });

    it("sets denied when watchPosition fires PERMISSION_DENIED", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      act(() => {
        watchErrorCb!(geoErr(1));
      });

      expect(result.current.geolocationStatus).toBe("denied");
      expect(result.current.locationPermissionStatus).toBe("denied");
    });

    it("calls clearWatch on unmount", async () => {
      const { unmount } = renderHook(() => useGeolocation(true));
      await flushAsync();

      unmount();

      expect(navigator.geolocation.clearWatch).toHaveBeenCalled();
    });

    it("isLocationReady becomes true once coords arrive", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      expect(result.current.isLocationReady).toBe(false);

      act(() => {
        watchSuccessCb!(pos(51.5, -0.1));
      });

      expect(result.current.isLocationReady).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Permission: denied
  // ───────────────────────────────────────────────────────────────────────────
  describe("permission: denied", () => {
    beforeEach(() => {
      permStatus.state = "denied";
    });

    it("sets locationPermissionStatus to 'denied'", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      expect(result.current.locationPermissionStatus).toBe("denied");
    });

    it("does NOT start watchPosition", async () => {
      renderHook(() => useGeolocation(true));
      await flushAsync();

      expect(navigator.geolocation.watchPosition).not.toHaveBeenCalled();
    });

    it("isLocationBlocked is true", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      expect(result.current.isLocationBlocked).toBe(true);
    });

    it("isLocationBlocked is false when capture is not required", () => {
      const { result } = renderHook(() => useGeolocation(false));
      expect(result.current.isLocationBlocked).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Permission: prompt (auto-prompt)
  // ───────────────────────────────────────────────────────────────────────────
  describe("permission: prompt (auto-prompt)", () => {
    beforeEach(() => {
      permStatus.state = "prompt";
    });

    it("does not call getCurrentPosition before 500ms", async () => {
      renderHook(() => useGeolocation(true));
      await flushAsync();

      await advanceBy(499);

      expect(currPosCalls).toHaveLength(0);
    });

    it("calls getCurrentPosition after 500ms delay", async () => {
      renderHook(() => useGeolocation(true));
      await flushAsync();

      await advanceBy(500);

      expect(currPosCalls).toHaveLength(1);
    });

    it("only auto-prompts once even after re-renders", async () => {
      const { rerender } = renderHook(() => useGeolocation(true));
      await flushAsync();
      await advanceBy(500);

      rerender();
      await advanceBy(500);

      expect(currPosCalls).toHaveLength(1);
    });

    // HIGH-2 regression
    it("[HIGH-2] starts watchPosition after user grants via auto-prompt", async () => {
      renderHook(() => useGeolocation(true));
      await flushAsync();
      await advanceBy(500);

      act(() => {
        currPosCalls[0].success(pos(40.7, -74.0));
      });

      expect(navigator.geolocation.watchPosition).toHaveBeenCalledTimes(1);
    });

    it("sets geolocation state when auto-prompt succeeds", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();
      await advanceBy(500);

      act(() => {
        currPosCalls[0].success(pos(40.7, -74.0));
      });

      expect(result.current.geolocation.latitude).toBe(40.7);
      expect(result.current.locationPermissionStatus).toBe("granted");
    });

    it("sets denied when user rejects auto-prompt", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();
      await advanceBy(500);

      act(() => {
        currPosCalls[0].error(geoErr(1));
      });

      expect(result.current.locationPermissionStatus).toBe("denied");
      expect(result.current.geolocationStatus).toBe("denied");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Permission change via onchange
  // ───────────────────────────────────────────────────────────────────────────
  describe("permission onchange events", () => {
    it("starts watchPosition when permission changes to granted", async () => {
      permStatus.state = "denied";
      renderHook(() => useGeolocation(true));
      await flushAsync();

      act(() => {
        permStatus.state = "granted";
        permStatus.onchange?.();
      });

      expect(navigator.geolocation.watchPosition).toHaveBeenCalledTimes(1);
    });

    it("calls clearWatch when permission changes to denied", async () => {
      renderHook(() => useGeolocation(true));
      await flushAsync();

      act(() => {
        permStatus.state = "denied";
        permStatus.onchange?.();
      });

      expect(navigator.geolocation.clearWatch).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // getCurrentLocation
  // ───────────────────────────────────────────────────────────────────────────
  describe("getCurrentLocation", () => {
    it("returns cached coords without calling getCurrentPosition", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      act(() => {
        watchSuccessCb!(pos(1.0, 2.0));
      });

      let location: { latitude: number; longitude: number } | null = null;
      await act(async () => {
        location = await result.current.getCurrentLocation();
      });

      expect(location).toEqual(expect.objectContaining({ latitude: 1.0, longitude: 2.0 }));
      expect(currPosCalls).toHaveLength(0);
    });

    it("bypasses cache when forceRefresh is true", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      act(() => {
        watchSuccessCb!(pos(1.0, 2.0));
      });

      act(() => {
        result.current.getCurrentLocation(true);
      });

      expect(currPosCalls).toHaveLength(1);
    });

    it("returns null immediately when permission is denied", async () => {
      permStatus.state = "denied";
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      let location: { latitude: number; longitude: number } | null = "not-null" as any;
      await act(async () => {
        location = await result.current.getCurrentLocation();
      });

      expect(location).toBeNull();
      expect(currPosCalls).toHaveLength(0);
    });

    it("calls getCurrentPosition when cache is empty", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      let locationPromise: Promise<{ latitude: number; longitude: number } | null>;
      act(() => {
        locationPromise = result.current.getCurrentLocation(true);
      });

      act(() => {
        currPosCalls[0].success(pos(48.8, 2.3));
      });

      const location = await act(async () => locationPromise!);
      expect(location).toEqual(expect.objectContaining({ latitude: 48.8, longitude: 2.3 }));
    });

    it("sets POSITION_UNAVAILABLE status on that error code", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      let location: any;
      act(() => {
        result.current.getCurrentLocation(true).then((l) => {
          location = l;
        });
      });

      act(() => {
        currPosCalls[0].error(geoErr(2));
      });

      await waitFor(() => {
        expect(location).toBeNull();
        expect(result.current.geolocationStatus).toBe("unavailable");
      });
    });

    // HIGH-1 regression
    it("[HIGH-1] treats 0,0 coordinates as a valid location", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      act(() => {
        watchSuccessCb!(pos(0, 0));
      });

      let location: { latitude: number; longitude: number } | null = null;
      await act(async () => {
        location = await result.current.getCurrentLocation();
      });

      expect(location).toEqual(expect.objectContaining({ latitude: 0, longitude: 0 }));
    });

    // MEDIUM-1 regression
    it("[MEDIUM-1] second concurrent call does not fire a second getCurrentPosition", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      act(() => {
        result.current.getCurrentLocation(true);
        result.current.getCurrentLocation(true);
      });

      expect(currPosCalls).toHaveLength(1);
    });

    // LOW-5 regression
    it("[LOW-5] retries with enableHighAccuracy:false after a timeout", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      act(() => {
        result.current.getCurrentLocation(true);
      });

      expect(currPosCalls[0].options?.enableHighAccuracy).toBe(true);

      act(() => {
        currPosCalls[0].error(geoErr(3));
      });

      await waitFor(() => {
        expect(currPosCalls).toHaveLength(2);
        expect(currPosCalls[1].options?.enableHighAccuracy).toBe(false);
      });
    });

    it("[LOW-5] resolves with cached location when both accuracy levels timeout", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      // Populate cache
      act(() => {
        watchSuccessCb!(pos(55.7, 37.6));
      });

      let location: any;
      act(() => {
        result.current.getCurrentLocation(true).then((l) => {
          location = l;
        });
      });

      act(() => {
        currPosCalls[0].error(geoErr(3)); // high accuracy timeout
      });
      await waitFor(() => expect(currPosCalls).toHaveLength(2));

      act(() => {
        currPosCalls[1].error(geoErr(3)); // low accuracy timeout → fall back to cache
      });

      await waitFor(() => {
        expect(location).toEqual(
          expect.objectContaining({ latitude: 55.7, longitude: 37.6 }),
        );
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // waitForGeolocation
  // ───────────────────────────────────────────────────────────────────────────
  describe("waitForGeolocation", () => {
    it("returns immediately when coords are already available", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      act(() => {
        watchSuccessCb!(pos(34.0, 118.2));
      });

      let location: any;
      await act(async () => {
        location = await result.current.waitForGeolocation();
      });

      expect(location).toEqual(
        expect.objectContaining({ latitude: 34.0, longitude: 118.2 }),
      );
    });

    it("resolves when watchPosition fires after the call", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      let location: any;
      act(() => {
        result.current.waitForGeolocation().then((l) => {
          location = l;
        });
      });

      act(() => {
        watchSuccessCb!(pos(22.3, 114.1));
      });

      await waitFor(() => {
        expect(location).toEqual(
          expect.objectContaining({ latitude: 22.3, longitude: 114.1 }),
        );
      });
    });

    it("returns null after 3-second safety timeout", async () => {
      permStatus.state = "prompt"; // location will not arrive
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      let location: any = "pending";
      act(() => {
        result.current.waitForGeolocation().then((l) => {
          location = l;
        });
      });

      await advanceBy(3000);

      await waitFor(() => {
        expect(location).toBeNull();
      });
    });

    // HIGH-1 regression
    it("[HIGH-1] resolves immediately for 0,0 coordinates", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      act(() => {
        watchSuccessCb!(pos(0, 0));
      });

      let location: any;
      await act(async () => {
        location = await result.current.waitForGeolocation();
      });

      expect(location).toEqual(
        expect.objectContaining({ latitude: 0, longitude: 0 }),
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // requestLocationAccess
  // ───────────────────────────────────────────────────────────────────────────
  describe("requestLocationAccess", () => {
    it("shows success toast when location is obtained", async () => {
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      // Populate cache so getCurrentLocation returns immediately
      act(() => {
        watchSuccessCb!(pos(51.5, -0.1));
      });

      await act(async () => {
        await result.current.requestLocationAccess();
      });

      expect(toast.success).toHaveBeenCalledWith("Location access granted");
    });

    it("shows error toast and sets denied when permission is denied", async () => {
      permStatus.state = "denied";
      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      await act(async () => {
        await result.current.requestLocationAccess();
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("denied"),
      );
      expect(result.current.locationPermissionStatus).toBe("denied");
    });

    it("shows error toast when geolocation API is unavailable", async () => {
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useGeolocation(true));
      await flushAsync();

      await act(async () => {
        await result.current.requestLocationAccess();
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Geolocation is not supported by your browser",
      );
    });
  });
});
