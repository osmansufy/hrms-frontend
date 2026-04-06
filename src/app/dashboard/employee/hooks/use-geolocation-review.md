<!-- cspell:ignore geolocation watchposition clearwatch enablehighaccuracy maximumage -->
# Code Review: `use-geolocation.ts`

**Reviewed by:** Senior Engineer  
**Date:** 2026-04-06  
**File:** `src/app/dashboard/employee/hooks/use-geolocation.ts`

---

## Summary

10 issues found across 3 severity levels. Two high-severity bugs can cause incorrect behavior in production (coordinates at 0,0 treated as "no location"; watch position never started after auto-prompt grant). The rest are medium/low — race conditions, stale closures, and encapsulation leaks.

---

## Issues

---

### [HIGH-1] Falsy check breaks for `0` coordinates

**Lines:** 238–240, 261, 397

**Problem:**  
`0` is a valid latitude (equator) and `0` is a valid longitude (prime meridian). All cache/result checks use truthy evaluation, so any location at `0,0` is treated as "no location available."

```ts
// WRONG — treats 0 as falsy
if (currentGeo.latitude && currentGeo.longitude && currentGeo.timestamp)
if (geo.latitude && geo.longitude)
if (currentLat && currentLng)
```

**Fix:**
```ts
// CORRECT — explicit undefined check
if (currentGeo.latitude !== undefined && currentGeo.longitude !== undefined && currentGeo.timestamp)
if (geo.latitude !== undefined && geo.longitude !== undefined)
if (currentLat !== undefined && currentLng !== undefined)
```

---

### [HIGH-2] Auto-prompt success never starts `watchPosition`

**Lines:** 193–214 (auto-prompt `useEffect`)

**Problem:**  
When the user grants permission via the auto-prompt (`getCurrentPosition` success callback), `startWatchingPosition()` is never called. The watch is only started in `checkLocationPermission` / `permissionStatus.onchange`. After grant here, `watchIdRef.current` stays `null` and no continuous position updates are received.

```ts
// Missing call after grant
(position) => {
  const { latitude, longitude } = position.coords;
  setGeolocation({ latitude, longitude, timestamp: Date.now() });
  setGeolocationStatus("available");
  setLocationPermissionStatus("granted");
  // ❌ startWatchingPosition() is never called here
},
```

**Fix:** Call `startWatchingPosition()` inside the success callback. Since that function is defined inside a different `useEffect`, refactor it to a `useRef`-backed stable function or lift it out.

---

### [MEDIUM-1] `isGettingLocation` stale closure in `getCurrentLocation`

**Line:** 256

**Problem:**  
`isGettingLocation` is a React state value closed over at `useCallback` creation time. Even though it is in the dependency array, concurrent calls within the same render cycle see the same snapshot. A second call immediately after the first won't see `isGettingLocation = true` yet.

```ts
// Stale — reads React state snapshot
if (isGettingLocation) {
```

**Fix:** Use a `useRef` for the in-progress flag:

```ts
const isGettingLocationRef = useRef(false);

// In getCurrentLocation:
if (isGettingLocationRef.current) { ... }

// When starting:
isGettingLocationRef.current = true;
setIsGettingLocation(true);

// When done:
isGettingLocationRef.current = false;
setIsGettingLocation(false);
```

---

### [MEDIUM-2] Race condition reading stale `geolocationStatus` in `requestLocationAccess`

**Lines:** 367–374

**Problem:**  
After `getCurrentLocation()` returns `null`, the code waits 100ms then reads `geolocationStatus` from the closure. This is unreliable — React state updates are async and the value may not have updated yet.

```ts
// Unreliable — 100ms is arbitrary, state may still be stale
await new Promise((resolve) => setTimeout(resolve, 100));
if (geolocationStatus === "denied") {
```

**Fix:** `getCurrentLocation` should communicate the failure reason via a returned value or thrown error, rather than relying on side-effect state being readable afterwards.

---

### [MEDIUM-3] `startWatchingPosition` / `stopWatchingPosition` not stable across effect re-runs

**Lines:** 89–105 (`permissionStatus.onchange` handler)

**Problem:**  
`startWatchingPosition` and `stopWatchingPosition` are plain functions defined inside the `useEffect` body. The `permissionStatus.onchange` callback captures them at registration time. If `captureEmployeeLocation` changes and the effect re-runs, the `onchange` handler still references the old closures from the previous run.

**Fix:** Move `startWatchingPosition` and `stopWatchingPosition` outside the effect as stable `useCallback`s (with `watchIdRef` as their only dependency), and reference them inside the effect.

---

### [LOW-1] Polling loops are fragile

**Lines:** 258–269 (`getCurrentLocation`), 390–405 (`waitForGeolocation`)

**Problem:**  
Both functions busy-poll with `setTimeout` loops waiting for `geolocationRef` to populate. If location never arrives, the caller silently receives `null` with no diagnostic info.

```ts
for (let i = 0; i < 30; i++) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  // check ref...
}
return null; // silent failure
```

**Fix:** Use a `Promise` that resolves when `watchPosition` fires. Store a pending resolver in a `useRef` and call it from the `watchPosition` success callback.

---

### [LOW-2] Dead code — `break` after `return` in TIMEOUT case

**Lines:** 325–330

**Problem:**  
Inside the `TIMEOUT` error case, a `return` statement exits the callback but is followed by a `break` that can never be reached.

```ts
case error.TIMEOUT:
  // ...
  if (cachedGeo.latitude && cachedGeo.longitude) {
    setIsGettingLocation(false);
    resolve({ ... });
    return; // exits callback
  }
  break; // ← dead code
```

**Fix:** Remove the `break`.

---

### [LOW-3] `geolocationRef` exposed in public API

**Line:** 416

**Problem:**  
`geolocationRef` is an internal implementation detail. Consumers referencing it directly bypass controlled access and can observe intermediate/inconsistent states.

**Fix:** Remove `geolocationRef` from the return value. If callers need synchronous access to the latest coordinates, expose a stable getter function:

```ts
const getLatestLocation = useCallback(() => geolocationRef.current, []);
```

---

### [LOW-4] Raw state setters exposed in public API

**Lines:** 421–422

**Problem:**  
Exposing `setGeolocation` and `setGeolocationError` directly lets consumers put the hook into inconsistent states — for example, setting coordinates without updating `geolocationStatus` or `locationPermissionStatus`.

**Fix:** Remove both from the return value. If external coordinate injection is needed, expose a controlled method that updates all related state atomically.

---

### [LOW-5] No `enableHighAccuracy` fallback

**Lines:** 159, 210, 343

**Problem:**  
All `getCurrentPosition` / `watchPosition` calls use `enableHighAccuracy: true`. On desktops or devices without GPS, this can result in timeouts with no fallback attempt, leaving users stuck.

**Fix:** On timeout error, retry once with `enableHighAccuracy: false` before giving up.

---

## Issue Summary

| ID | Severity | Location | Issue |
|----|----------|----------|-------|
| HIGH-1 | High | Lines 238, 261, 397 | Falsy check treats `0,0` coordinates as missing |
| HIGH-2 | High | Lines 193–214 | Auto-prompt grant never starts `watchPosition` |
| MEDIUM-1 | Medium | Line 256 | `isGettingLocation` stale closure — use `useRef` |
| MEDIUM-2 | Medium | Lines 367–374 | Stale state read after arbitrary 100ms delay |
| MEDIUM-3 | Medium | Lines 89–105 | Unstable closures captured in `onchange` handler |
| LOW-1 | Low | Lines 258–269, 390–405 | Polling loops — fragile and silent on failure |
| LOW-2 | Low | Lines 325–330 | Dead `break` after `return` |
| LOW-3 | Low | Line 416 | Internal `geolocationRef` leaked in public API |
| LOW-4 | Low | Lines 421–422 | Raw state setters leaked in public API |
| LOW-5 | Low | Lines 159, 210, 343 | No `enableHighAccuracy: false` fallback on timeout |

---

## Recommended Fix Priority

1. **HIGH-1** — Fix all falsy coordinate checks immediately (one-line fix, high impact)
2. **HIGH-2** — Add `startWatchingPosition()` call in auto-prompt success callback
3. **MEDIUM-1** — Replace `isGettingLocation` state flag with a `useRef`
4. **MEDIUM-3** — Lift `startWatchingPosition`/`stopWatchingPosition` into stable `useCallback`s
5. **MEDIUM-2** — Eliminate 100ms delay hack; communicate errors through return values
6. **LOW-1 through LOW-5** — Address in a follow-up cleanup pass

---

## Fix Progress

| ID | Severity | Issue | Status | Notes |
|----|----------|-------|--------|-------|
| HIGH-1 | High | Falsy check treats `0,0` coordinates as missing | `[x] DONE` | All checks changed to `!== undefined` |
| HIGH-2 | High | Auto-prompt grant never starts `watchPosition` | `[x] DONE` | Added `startWatchingPosition()` in auto-prompt success callback |
| MEDIUM-1 | Medium | `isGettingLocation` stale closure — use `useRef` | `[x] DONE` | Added `isGettingLocationRef`; set/clear alongside state |
| MEDIUM-2 | Medium | Stale state read after arbitrary 100ms delay | `[x] DONE` | Replaced 100ms hack with direct Permissions API query |
| MEDIUM-3 | Medium | Unstable closures captured in `onchange` handler | `[x] DONE` | `startWatchingPosition` / `stopWatchingPosition` lifted to `useCallback` |
| LOW-1 | Low | Polling loops — fragile and silent on failure | `[x] DONE` | Replaced loops with `pendingLocationResolversRef` Promise pattern |
| LOW-2 | Low | Dead `break` after `return` | `[x] DONE` | Removed dead `break` in TIMEOUT case |
| LOW-3 | Low | Internal `geolocationRef` leaked in public API | `[ ] DEFERRED` | Still consumed by `page.tsx` and `attendance-handlers.ts` — requires consumer refactor |
| LOW-4 | Low | Raw state setters leaked in public API | `[ ] DEFERRED` | Still consumed by `page.tsx` — requires consumer refactor |
| LOW-5 | Low | No `enableHighAccuracy: false` fallback on timeout | `[x] DONE` | Added `tryGetPosition(highAccuracy)` helper with fallback retry |

**Legend:** `[ ] TODO` · `[~] IN PROGRESS` · `[x] DONE` · `[ ] DEFERRED`

_Last updated: 2026-04-06_
