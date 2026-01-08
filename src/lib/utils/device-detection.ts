/**
 * Frontend Device Detection Utility
 *
 * Detects device type to ensure attendance check-in/check-out
 * is only allowed from desktop/laptop devices (PC).
 */

export enum DeviceType {
  DESKTOP = "desktop",
  MOBILE = "mobile",
  TABLET = "tablet",
  UNKNOWN = "unknown",
}

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  // Additional validation metadata
  screenWidth?: number;
  screenHeight?: number;
  hasTouchScreen?: boolean;
  confidence?: "high" | "medium" | "low"; // Detection confidence level
}

/**
 * Detects device type from browser User-Agent
 * @returns DeviceInfo object with device type and flags
 */
export function detectDevice(): DeviceInfo {
  if (typeof window === "undefined") {
    // Server-side rendering - default to desktop
    return {
      type: DeviceType.UNKNOWN,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      userAgent: "server-side",
    };
  }

  const userAgent = navigator.userAgent || "";
  const ua = userAgent.toLowerCase();

  // Get screen and touch information for additional validation
  const screenWidth = window.innerWidth || screen.width || 0;
  const screenHeight = window.innerHeight || screen.height || 0;
  const hasTouchScreen =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Common mobile device patterns
  const mobilePatterns = [
    /android.*mobile/i,
    /iphone/i,
    /ipod/i,
    /blackberry/i,
    /windows phone/i,
    /opera mini/i,
    /mobile/i,
  ];

  // Common tablet patterns
  const tabletPatterns = [
    /ipad/i,
    /android(?!.*mobile)/i,
    /tablet/i,
    /playbook/i,
    /kindle/i,
    /silk/i,
  ];

  // Desktop patterns (Windows, Mac, Linux)
  const desktopPatterns = [
    /windows/i,
    /macintosh/i,
    /mac os/i,
    /linux/i,
    /x11/i,
  ];

  // Primary detection: User-Agent patterns
  const isTabletUA = tabletPatterns.some((pattern) => pattern.test(ua));
  const isMobileUA =
    !isTabletUA && mobilePatterns.some((pattern) => pattern.test(ua));
  const isDesktopUA =
    !isMobileUA &&
    !isTabletUA &&
    desktopPatterns.some((pattern) => pattern.test(ua));

  // Secondary validation: Screen size and touch support
  // These help catch spoofed User-Agents and edge cases

  // Screen size thresholds
  const MOBILE_MAX_WIDTH = 768; // Below this is likely mobile
  const TABLET_MAX_WIDTH = 1024; // Between 768-1024 might be tablet
  const DESKTOP_MIN_WIDTH = 1024; // Above this is likely desktop

  // Validation flags
  let screenSuggestsMobile = screenWidth > 0 && screenWidth < MOBILE_MAX_WIDTH;
  let screenSuggestsTablet =
    screenWidth >= MOBILE_MAX_WIDTH && screenWidth < DESKTOP_MIN_WIDTH;
  let screenSuggestsDesktop = screenWidth >= DESKTOP_MIN_WIDTH;

  // Determine device type with multi-factor validation
  let type: DeviceType;
  let confidence: "high" | "medium" | "low" = "high";

  if (isMobileUA) {
    // User-Agent says mobile
    if (screenSuggestsMobile && hasTouchScreen) {
      // Screen and touch confirm mobile - high confidence
      type = DeviceType.MOBILE;
      confidence = "high";
    } else if (screenSuggestsDesktop && !hasTouchScreen) {
      // Screen suggests desktop but UA says mobile - possible spoofing
      // Trust screen over UA in this case (might be desktop browser spoofing)
      type = DeviceType.DESKTOP;
      confidence = "medium";
    } else {
      // Trust UA but lower confidence
      type = DeviceType.MOBILE;
      confidence = "medium";
    }
  } else if (isTabletUA) {
    // User-Agent says tablet
    if (screenSuggestsTablet && hasTouchScreen) {
      // Screen and touch confirm tablet - high confidence
      type = DeviceType.TABLET;
      confidence = "high";
    } else if (screenSuggestsDesktop && hasTouchScreen) {
      // Large screen + touch + tablet UA = might be touch laptop with spoofed UA
      // But we should block tablets, so trust UA
      type = DeviceType.TABLET;
      confidence = "medium";
    } else {
      type = DeviceType.TABLET;
      confidence = "medium";
    }
  } else if (isDesktopUA) {
    // User-Agent says desktop
    if (screenSuggestsDesktop) {
      // Screen confirms desktop - high confidence
      type = DeviceType.DESKTOP;
      confidence = "high";
    } else if (screenSuggestsMobile && hasTouchScreen) {
      // Small screen + touch but desktop UA - likely spoofed, trust screen
      type = DeviceType.MOBILE;
      confidence = "medium";
    } else if (screenSuggestsTablet && hasTouchScreen) {
      // Tablet-sized screen + touch but desktop UA - might be tablet spoofing
      type = DeviceType.TABLET;
      confidence = "medium";
    } else {
      // Trust UA but lower confidence
      type = DeviceType.DESKTOP;
      confidence = "medium";
    }
  } else {
    // Unknown User-Agent - use screen and touch as primary indicators
    if (screenSuggestsMobile && hasTouchScreen) {
      type = DeviceType.MOBILE;
      confidence = "medium";
    } else if (screenSuggestsTablet && hasTouchScreen) {
      type = DeviceType.TABLET;
      confidence = "medium";
    } else if (screenSuggestsDesktop) {
      // Large screen without clear mobile indicators = desktop
      type = DeviceType.DESKTOP;
      confidence = "medium";
    } else {
      // Truly unknown - default to desktop for flexibility
      type = DeviceType.UNKNOWN;
      confidence = "low";
    }
  }

  // Final validation: Touch laptops (Surface, etc.) should be allowed
  // If we have desktop UA + large screen + touch, it's a touch laptop
  if (
    isDesktopUA &&
    screenSuggestsDesktop &&
    hasTouchScreen &&
    type === DeviceType.DESKTOP
  ) {
    // This is a touch laptop - keep as desktop
    type = DeviceType.DESKTOP;
    confidence = "high";
  }

  const isMobile = type === DeviceType.MOBILE;
  const isTablet = type === DeviceType.TABLET;
  const isDesktop = type === DeviceType.DESKTOP || type === DeviceType.UNKNOWN;

  return {
    type,
    isMobile,
    isTablet,
    isDesktop,
    userAgent,
    screenWidth,
    screenHeight,
    hasTouchScreen,
    confidence,
  };
}

/**
 * Checks if the device is allowed for attendance operations
 * Only desktop/laptop devices are allowed
 * Uses multi-factor validation: User-Agent + Screen size + Touch support
 * @returns true if device is allowed (desktop), false otherwise
 */
export function isDeviceAllowedForAttendance(): boolean {
  const deviceInfo = detectDevice();

  // Block if clearly mobile or tablet
  if (deviceInfo.isMobile || deviceInfo.isTablet) {
    return false;
  }

  // Allow desktop devices
  if (deviceInfo.isDesktop) {
    return true;
  }

  // For unknown devices, use additional validation
  // Block if screen is too small or has mobile characteristics
  if (deviceInfo.screenWidth && deviceInfo.screenWidth < 768) {
    return false; // Too small to be a desktop
  }

  // Block if it's a small touch device (likely mobile)
  if (
    deviceInfo.screenWidth &&
    deviceInfo.screenWidth < 1024 &&
    deviceInfo.hasTouchScreen &&
    !deviceInfo.isDesktop
  ) {
    return false; // Small touch device, likely tablet/mobile
  }

  // Default to allowing unknown devices (for flexibility)
  return true;
}

/**
 * Gets a user-friendly error message for device restriction
 * @param deviceType - The detected device type
 * @returns Error message string
 */
export function getDeviceRestrictionMessage(deviceType: DeviceType): string {
  switch (deviceType) {
    case DeviceType.MOBILE:
      return "Attendance check-in/check-out is only allowed from desktop or laptop computers. Please use a PC to mark your attendance.";
    case DeviceType.TABLET:
      return "Attendance check-in/check-out is only allowed from desktop or laptop computers. Tablets are not permitted. Please use a PC to mark your attendance.";
    case DeviceType.UNKNOWN:
      return "Unable to verify device type. Attendance check-in/check-out is only allowed from desktop or laptop computers.";
    default:
      return "Attendance check-in/check-out is only allowed from desktop or laptop computers.";
  }
}
