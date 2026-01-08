/**
 * @jest-environment jsdom
 */

import {
  detectDevice,
  isDeviceAllowedForAttendance,
  getDeviceRestrictionMessage,
  DeviceType,
} from "./device-detection";

// Mock window and navigator
const mockNavigator = (userAgent: string) => {
  Object.defineProperty(window, "navigator", {
    writable: true,
    value: {
      userAgent,
      maxTouchPoints: 0,
    },
  });
};

const mockWindow = (width: number, hasTouch: boolean = false) => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, "screen", {
    writable: true,
    configurable: true,
    value: { width },
  });

  if (hasTouch) {
    (window as any).ontouchstart = {};
    Object.defineProperty(navigator, "maxTouchPoints", {
      writable: true,
      configurable: true,
      value: 1,
    });
  } else {
    delete (window as any).ontouchstart;
    Object.defineProperty(navigator, "maxTouchPoints", {
      writable: true,
      configurable: true,
      value: 0,
    });
  }
};

describe("DeviceDetection (Frontend)", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe("detectDevice", () => {
    describe("Desktop devices", () => {
      it("should detect Windows desktop", () => {
        mockNavigator(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );
        mockWindow(1920);

        const result = detectDevice();

        expect(result.type).toBe(DeviceType.DESKTOP);
        expect(result.isDesktop).toBe(true);
        expect(result.isMobile).toBe(false);
        expect(result.isTablet).toBe(false);
      });

      it("should detect macOS desktop", () => {
        mockNavigator(
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );
        mockWindow(1920);

        const result = detectDevice();

        expect(result.type).toBe(DeviceType.DESKTOP);
        expect(result.isDesktop).toBe(true);
        expect(result.isMobile).toBe(false);
        expect(result.isTablet).toBe(false);
      });

      it("should detect Linux desktop", () => {
        mockNavigator(
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );
        mockWindow(1920);

        const result = detectDevice();

        expect(result.type).toBe(DeviceType.DESKTOP);
        expect(result.isDesktop).toBe(true);
        expect(result.isMobile).toBe(false);
        expect(result.isTablet).toBe(false);
      });

      it("should detect touch-enabled laptop as desktop", () => {
        mockNavigator(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        );
        mockWindow(1920, true); // Touch screen but desktop OS

        const result = detectDevice();

        expect(result.type).toBe(DeviceType.DESKTOP);
        expect(result.isDesktop).toBe(true);
      });
    });

    describe("Mobile devices", () => {
      it("should detect iPhone", () => {
        mockNavigator(
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        );
        mockWindow(375, true);

        const result = detectDevice();

        expect(result.type).toBe(DeviceType.MOBILE);
        expect(result.isMobile).toBe(true);
        expect(result.isDesktop).toBe(false);
        expect(result.isTablet).toBe(false);
      });

      it("should detect Android mobile", () => {
        mockNavigator(
          "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        );
        mockWindow(360, true);

        const result = detectDevice();

        expect(result.type).toBe(DeviceType.MOBILE);
        expect(result.isMobile).toBe(true);
        expect(result.isDesktop).toBe(false);
        expect(result.isTablet).toBe(false);
      });

      it("should detect Windows Phone", () => {
        mockNavigator(
          "Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1; DEVICE INFO) AppleWebKit/537.36"
        );
        mockWindow(480, true);

        const result = detectDevice();

        expect(result.type).toBe(DeviceType.MOBILE);
        expect(result.isMobile).toBe(true);
        expect(result.isDesktop).toBe(false);
      });

      it("should detect small screen with touch as mobile (fallback)", () => {
        mockNavigator("UnknownBrowser/1.0");
        mockWindow(320, true); // Small screen with touch

        const result = detectDevice();

        expect(result.type).toBe(DeviceType.MOBILE);
        expect(result.isMobile).toBe(true);
        expect(result.isDesktop).toBe(false);
      });
    });

    describe("Tablet devices", () => {
      it("should detect iPad", () => {
        mockNavigator(
          "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        );
        mockWindow(1024, true);

        const result = detectDevice();

        expect(result.type).toBe(DeviceType.TABLET);
        expect(result.isTablet).toBe(true);
        expect(result.isMobile).toBe(false);
        expect(result.isDesktop).toBe(false);
      });

      it("should detect Android tablet (without mobile)", () => {
        mockNavigator(
          "Mozilla/5.0 (Linux; Android 13; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );
        mockWindow(1024, true);

        const result = detectDevice();

        expect(result.type).toBe(DeviceType.TABLET);
        expect(result.isTablet).toBe(true);
        expect(result.isMobile).toBe(false);
        expect(result.isDesktop).toBe(false);
      });

      it("should detect Kindle", () => {
        mockNavigator(
          "Mozilla/5.0 (Linux; U; en-US) AppleWebKit/528.5+ (KHTML, like Gecko, Safari/528.5+) Version/4.0 Kindle/3.0"
        );
        mockWindow(800, true);

        const result = detectDevice();

        expect(result.type).toBe(DeviceType.TABLET);
        expect(result.isTablet).toBe(true);
        expect(result.isDesktop).toBe(false);
      });
    });

    describe("Server-side rendering", () => {
      it("should default to desktop when window is undefined", () => {
        // Temporarily remove window
        const originalWindow = global.window;
        // @ts-ignore
        delete global.window;

        const result = detectDevice();

        expect(result.type).toBe(DeviceType.UNKNOWN);
        expect(result.isDesktop).toBe(true); // Defaults to desktop for SSR
        expect(result.userAgent).toBe("server-side");

        // Restore window
        global.window = originalWindow;
      });
    });

    describe("Edge cases", () => {
      it("should handle empty user agent", () => {
        mockNavigator("");
        mockWindow(1920);

        const result = detectDevice();

        expect(result.userAgent).toBe("");
      });

      it("should handle unknown user agents", () => {
        mockNavigator("SomeUnknownBrowser/1.0");
        mockWindow(1920);

        const result = detectDevice();

        expect(result.type).toBe(DeviceType.UNKNOWN);
        expect(result.isDesktop).toBe(true); // Unknown defaults to desktop
      });

      it("should prioritize tablet detection over mobile", () => {
        mockNavigator(
          "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
        );
        mockWindow(1024, true);

        const result = detectDevice();

        expect(result.type).toBe(DeviceType.TABLET);
        expect(result.isTablet).toBe(true);
        expect(result.isMobile).toBe(false);
      });
    });
  });

  describe("isDeviceAllowedForAttendance", () => {
    it("should allow Windows desktop", () => {
      mockNavigator(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      );
      mockWindow(1920);

      expect(isDeviceAllowedForAttendance()).toBe(true);
    });

    it("should allow macOS desktop", () => {
      mockNavigator(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      );
      mockWindow(1920);

      expect(isDeviceAllowedForAttendance()).toBe(true);
    });

    it("should allow Linux desktop", () => {
      mockNavigator(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0"
      );
      mockWindow(1920);

      expect(isDeviceAllowedForAttendance()).toBe(true);
    });

    it("should block iPhone", () => {
      mockNavigator(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
      );
      mockWindow(375, true);

      expect(isDeviceAllowedForAttendance()).toBe(false);
    });

    it("should block Android mobile", () => {
      mockNavigator(
        "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 Mobile Safari/537.36"
      );
      mockWindow(360, true);

      expect(isDeviceAllowedForAttendance()).toBe(false);
    });

    it("should block iPad", () => {
      mockNavigator(
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
      );
      mockWindow(1024, true);

      expect(isDeviceAllowedForAttendance()).toBe(false);
    });

    it("should block Android tablet", () => {
      mockNavigator(
        "Mozilla/5.0 (Linux; Android 13; Pixel Tablet) AppleWebKit/537.36"
      );
      mockWindow(1024, true);

      expect(isDeviceAllowedForAttendance()).toBe(false);
    });

    it("should allow unknown devices (defaults to desktop)", () => {
      mockNavigator("UnknownBrowser/1.0");
      mockWindow(1920);

      expect(isDeviceAllowedForAttendance()).toBe(true);
    });
  });

  describe("getDeviceRestrictionMessage", () => {
    it("should return mobile restriction message", () => {
      const message = getDeviceRestrictionMessage(DeviceType.MOBILE);
      expect(message).toContain("desktop or laptop computers");
      expect(message).toContain("Please use a PC");
    });

    it("should return tablet restriction message", () => {
      const message = getDeviceRestrictionMessage(DeviceType.TABLET);
      expect(message).toContain("desktop or laptop computers");
      expect(message).toContain("Tablets are not permitted");
      expect(message).toContain("Please use a PC");
    });

    it("should return unknown device restriction message", () => {
      const message = getDeviceRestrictionMessage(DeviceType.UNKNOWN);
      expect(message).toContain("Unable to verify device type");
      expect(message).toContain("desktop or laptop computers");
    });

    it("should return default message for desktop (should not happen in practice)", () => {
      const message = getDeviceRestrictionMessage(DeviceType.DESKTOP);
      expect(message).toContain("desktop or laptop computers");
    });
  });

  describe("Real-world user agent examples", () => {
    const testCases = [
      {
        name: "Windows Chrome",
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        width: 1920,
        expected: DeviceType.DESKTOP,
        allowed: true,
      },
      {
        name: "macOS Safari",
        ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        width: 1920,
        expected: DeviceType.DESKTOP,
        allowed: true,
      },
      {
        name: "iPhone Safari",
        ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
        width: 375,
        touch: true,
        expected: DeviceType.MOBILE,
        allowed: false,
      },
      {
        name: "Android Chrome Mobile",
        ua: "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        width: 360,
        touch: true,
        expected: DeviceType.MOBILE,
        allowed: false,
      },
      {
        name: "iPad Safari",
        ua: "Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
        width: 1024,
        touch: true,
        expected: DeviceType.TABLET,
        allowed: false,
      },
    ];

    testCases.forEach(({ name, ua, width, touch, expected, allowed }) => {
      it(`should correctly detect ${expected} for ${name}`, () => {
        mockNavigator(ua);
        mockWindow(width, touch);

        const result = detectDevice();
        expect(result.type).toBe(expected);
        expect(isDeviceAllowedForAttendance()).toBe(allowed);
      });
    });
  });
});
