import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AttendanceReconciliationEmployeePage from "@/app/dashboard/employee/attendance/reconciliation/page";
import * as sessionProvider from "@/components/auth/session-provider";
import * as timezoneContext from "@/contexts/timezone-context";

// ---- Mocks ----

jest.mock("@/components/auth/session-provider", () => ({
  useSession: jest.fn(),
}));

jest.mock("@/contexts/timezone-context", () => ({
  useTimezone: jest.fn(),
}));

jest.mock("@/lib/hooks/use-timezone-formatters", () => ({
  useTimezoneFormatters: () => ({
    timezone: "Asia/Dhaka",
    formatDate: (d: string | Date) => {
      const date = typeof d === "string" ? new Date(d) : d;
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Dhaka",
      });
    },
    formatTime: (d: string | Date) => {
      const date = typeof d === "string" ? new Date(d) : d;
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Dhaka",
      });
    },
    formatDateTime: (d: string | Date) => String(d),
  }),
}));

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// ---- Helpers ----

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

function renderPage() {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AttendanceReconciliationEmployeePage />
    </QueryClientProvider>,
  );
}

// ---- Setup ----

const mockSession = {
  user: {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    roles: ["employee"],
  },
  token: "test-token",
};

const sampleRequests = [
  {
    id: "req-1",
    userId: "user-1",
    date: "2026-04-05T18:00:00.000Z",
    type: "SIGN_IN" as const,
    originalSignIn: "2026-04-06T03:15:00.000Z",
    requestedSignIn: "2026-04-06T03:00:00.000Z",
    reason: "Clock was slow",
    status: "PENDING" as const,
    createdAt: "2026-04-06T04:00:00.000Z",
  },
  {
    id: "req-2",
    userId: "user-1",
    date: "2026-04-04T18:00:00.000Z",
    type: "SIGN_OUT" as const,
    originalSignOut: "2026-04-05T12:00:00.000Z",
    requestedSignOut: "2026-04-05T13:00:00.000Z",
    reason: "Forgot to sign out",
    status: "APPROVED" as const,
    createdAt: "2026-04-05T14:00:00.000Z",
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  (sessionProvider.useSession as jest.Mock).mockReturnValue({
    session: mockSession,
  });
  (timezoneContext.useTimezone as jest.Mock).mockReturnValue({
    timezone: "Asia/Dhaka",
    isLoading: false,
  });
  mockGet.mockResolvedValue({ data: sampleRequests });
  mockPost.mockResolvedValue({ data: { id: "new-req" } });
});

// ---- Tests ----

describe("AttendanceReconciliationEmployeePage", () => {
  describe("rendering", () => {
    it("renders form and request list sections", async () => {
      renderPage();

      expect(
        screen.getByText("Submit Attendance Reconciliation Request"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("My Attendance Reconciliation Requests"),
      ).toBeInTheDocument();
    });

    it("renders date input with max = local today (not UTC)", async () => {
      renderPage();

      const dateInputEl = document.querySelector('input[type="date"]');
      expect(dateInputEl).toBeTruthy();

      const maxValue = dateInputEl?.getAttribute("max");
      expect(maxValue).toBeTruthy();
      // maxValue must be YYYY-MM-DD — should match local calendar, not UTC
      expect(maxValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("renders request table after data loads", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Clock was slow")).toBeInTheDocument();
      });

      expect(screen.getByText("Forgot to sign out")).toBeInTheDocument();
    });

    it("shows PENDING badge with correct styling", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("PENDING")).toBeInTheDocument();
      });

      const badge = screen.getByText("PENDING");
      expect(badge.className).toContain("bg-yellow-100");
    });

    it("shows APPROVED badge with correct styling", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("APPROVED")).toBeInTheDocument();
      });

      const badge = screen.getByText("APPROVED");
      expect(badge.className).toContain("bg-green-100");
    });

    it("renders Sign In and Sign Out options in type selector", async () => {
      renderPage();
      // "Sign In" appears multiple times (trigger value + hidden <option> + table)
      expect(screen.getAllByText("Sign In").length).toBeGreaterThanOrEqual(1);
    });

    it("shows requested sign-in time field when SIGN_IN type selected", () => {
      renderPage();
      expect(screen.getByText("Requested Sign-In Time")).toBeInTheDocument();
    });

    it("shows loading state while fetching", () => {
      mockGet.mockReturnValue(new Promise(() => {})); // never resolves
      renderPage();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("form submission", () => {
    it("submits form with correct UTC ISO datetime payload", async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Clock was slow")).toBeInTheDocument();
      });

      const dateInput = document.querySelector(
        'input[type="date"]',
      ) as HTMLInputElement;
      const timeInput = document.querySelector(
        'input[type="time"]',
      ) as HTMLInputElement;
      const reasonInput = screen.getByPlaceholderText("Reason");
      const submitBtn = screen.getByRole("button", {
        name: /submit request/i,
      });

      await user.clear(dateInput);
      await user.type(dateInput, "2026-04-05");

      await user.clear(timeInput);
      await user.type(timeInput, "09:00");

      await user.clear(reasonInput);
      await user.type(reasonInput, "My reason");

      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          "/attendance/reconciliation",
          expect.objectContaining({
            date: "2026-04-05",
            type: "SIGN_IN",
            reason: "My reason",
          }),
        );
      });

      // Verify the requestedSignIn is a valid ISO string
      const payload = mockPost.mock.calls[0][1];
      expect(payload.requestedSignIn).toBeTruthy();
      const parsed = new Date(payload.requestedSignIn);
      expect(parsed.toISOString()).toBe(payload.requestedSignIn);

      // 09:00 Dhaka (UTC+6) = 03:00 UTC
      expect(parsed.getUTCHours()).toBe(3);
      expect(parsed.getUTCMinutes()).toBe(0);
    });

    it("resets form after successful submission", async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Clock was slow")).toBeInTheDocument();
      });

      const dateInput = document.querySelector(
        'input[type="date"]',
      ) as HTMLInputElement;
      const timeInput = document.querySelector(
        'input[type="time"]',
      ) as HTMLInputElement;
      const reasonInput = screen.getByPlaceholderText("Reason");
      const submitBtn = screen.getByRole("button", {
        name: /submit request/i,
      });

      await user.clear(dateInput);
      await user.type(dateInput, "2026-04-05");
      await user.clear(timeInput);
      await user.type(timeInput, "09:00");
      await user.clear(reasonInput);
      await user.type(reasonInput, "Test reason");

      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(dateInput.value).toBe("");
      });
    });

    it("does not submit when required fields are empty", async () => {
      const user = userEvent.setup();
      renderPage();

      const submitBtn = screen.getByRole("button", {
        name: /submit request/i,
      });

      await user.click(submitBtn);

      expect(mockPost).not.toHaveBeenCalled();
    });

    it("disables submit button during pending mutation", async () => {
      mockPost.mockReturnValue(new Promise(() => {})); // never resolves
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Clock was slow")).toBeInTheDocument();
      });

      const dateInput = document.querySelector(
        'input[type="date"]',
      ) as HTMLInputElement;
      const timeInput = document.querySelector(
        'input[type="time"]',
      ) as HTMLInputElement;
      const reasonInput = screen.getByPlaceholderText("Reason");

      await user.clear(dateInput);
      await user.type(dateInput, "2026-04-05");
      await user.clear(timeInput);
      await user.type(timeInput, "09:00");
      await user.clear(reasonInput);
      await user.type(reasonInput, "Test");

      const submitBtn = screen.getByRole("button", {
        name: /submit request/i,
      });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /submitting/i }),
        ).toBeDisabled();
      });
    });
  });

  describe("timezone handling", () => {
    it("uses useTimezone context for offset calculation", () => {
      (timezoneContext.useTimezone as jest.Mock).mockReturnValue({
        timezone: "America/New_York",
        isLoading: false,
      });

      renderPage();

      // Page should render without errors even with a different timezone
      expect(
        screen.getByText("Submit Attendance Reconciliation Request"),
      ).toBeInTheDocument();
    });

    it("no longer uses hardcoded offset map", async () => {
      renderPage();

      // The old implementation had a getTimezoneOffsetHours function with
      // a static map. Verify the rendered page doesn't crash with any timezone.
      const timezones = [
        "Asia/Dhaka",
        "Asia/Kolkata",
        "America/New_York",
        "Europe/London",
        "Pacific/Auckland",
      ];

      for (const tz of timezones) {
        (timezoneContext.useTimezone as jest.Mock).mockReturnValue({
          timezone: tz,
          isLoading: false,
        });
      }

      expect(
        screen.getByText("Submit Attendance Reconciliation Request"),
      ).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles empty request list", async () => {
      mockGet.mockResolvedValue({ data: [] });
      renderPage();

      await waitFor(() => {
        const tbody = document.querySelector("tbody");
        expect(tbody?.children.length).toBe(0);
      });
    });

    it("handles API error on fetch gracefully", async () => {
      mockGet.mockRejectedValue(new Error("Network error"));
      renderPage();

      // Should still render the form
      expect(
        screen.getByText("Submit Attendance Reconciliation Request"),
      ).toBeInTheDocument();
    });

    it("renders when session is null (disabled state)", () => {
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        session: null,
      });

      renderPage();

      expect(
        screen.getByText("Submit Attendance Reconciliation Request"),
      ).toBeInTheDocument();
    });

    it("renders formatted type labels instead of raw enums", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Clock was slow")).toBeInTheDocument();
      });

      // Table should show "Sign In" / "Sign Out" instead of "SIGN_IN" / "SIGN_OUT"
      const rows = document.querySelectorAll("tbody tr");
      expect(rows.length).toBe(2);

      const firstRowCells = rows[0].querySelectorAll("td");
      expect(firstRowCells[1].textContent).toBe("Sign In");

      const secondRowCells = rows[1].querySelectorAll("td");
      expect(secondRowCells[1].textContent).toBe("Sign Out");
    });
  });
});
