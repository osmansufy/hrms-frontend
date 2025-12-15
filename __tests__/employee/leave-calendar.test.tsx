import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import LeaveCalendarPage from "@/app/dashboard/employee/leave/calendar/page";
import * as sessionProvider from "@/components/auth/session-provider";
import * as leaveQueries from "@/lib/queries/leave";

// Mock session provider
jest.mock("@/components/auth/session-provider", () => ({
    useSession: jest.fn(),
}));

// Mock leave queries
jest.mock("@/lib/queries/leave", () => ({
    useMyLeaves: jest.fn(),
    useLeaveTypes: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
    })),
}));

const createQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

const renderWithProviders = (ui: React.ReactElement) => {
    const queryClient = createQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
};

const mockLeaves = [
    {
        id: "leave-1",
        leaveTypeId: "lt-1",
        leaveType: { name: "Annual Leave", code: "AL" },
        startDate: "2025-12-20",
        endDate: "2025-12-25",
        status: "APPROVED",
        reason: "Holiday vacation",
    },
    {
        id: "leave-2",
        leaveTypeId: "lt-2",
        leaveType: { name: "Sick Leave", code: "SL" },
        startDate: "2025-12-01",
        endDate: "2025-12-02",
        status: "PENDING",
        reason: "Doctor appointment",
    },
    {
        id: "leave-3",
        leaveTypeId: "lt-3",
        leaveType: { name: "Personal Leave", code: "PL" },
        startDate: "2025-11-15",
        endDate: "2025-11-15",
        status: "REJECTED",
        reason: "Personal matter",
    },
];

describe("LeaveCalendarPage", () => {
    const mockSession = {
        user: { id: "user-1", email: "test@example.com", name: "Test User", roles: ["employee"] },
        token: "test-token",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (sessionProvider.useSession as jest.Mock).mockReturnValue({ session: mockSession });
        // Mock useLeaveTypes
        (leaveQueries.useLeaveTypes as jest.Mock).mockReturnValue({
            data: [
                { id: "lt-1", name: "Annual Leave", code: "AL" },
                { id: "lt-2", name: "Sick Leave", code: "SL" },
                { id: "lt-3", name: "Personal Leave", code: "PL" },
            ],
            isLoading: false,
        });
    });

    it("renders calendar page header", () => {
        (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
            data: mockLeaves,
            isLoading: false,
        });

        renderWithProviders(<LeaveCalendarPage />);

        expect(screen.getByText("Leave Calendar")).toBeInTheDocument();
    });

    it("renders month navigation buttons", () => {
        (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
            data: mockLeaves,
            isLoading: false,
        });

        renderWithProviders(<LeaveCalendarPage />);

        expect(screen.getByText("Previous")).toBeInTheDocument();
        expect(screen.getByText("Next")).toBeInTheDocument();
        expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it("renders status filter dropdown", () => {
        (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
            data: mockLeaves,
            isLoading: false,
        });

        renderWithProviders(<LeaveCalendarPage />);

        expect(screen.getByText("All Statuses")).toBeInTheDocument();
    });

    it("renders leave type filter dropdown", () => {
        (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
            data: mockLeaves,
            isLoading: false,
        });

        renderWithProviders(<LeaveCalendarPage />);

        expect(screen.getByText("All Leave Types")).toBeInTheDocument();
    });

    it("displays status legend", () => {
        (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
            data: mockLeaves,
            isLoading: false,
        });

        renderWithProviders(<LeaveCalendarPage />);

        expect(screen.getByText("Approved")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
        expect(screen.getByText("Rejected")).toBeInTheDocument();
    });

    it("shows loading state", () => {
        (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: true,
        });

        renderWithProviders(<LeaveCalendarPage />);

        expect(screen.getByText("Loading calendar...")).toBeInTheDocument();
    });

    it("navigates to next month when Next button is clicked", async () => {
        const user = userEvent.setup();
        (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
            data: mockLeaves,
            isLoading: false,
        });

        renderWithProviders(<LeaveCalendarPage />);

        const nextButton = screen.getByText("Next");
        await user.click(nextButton);

        // Calendar should still be rendered after navigation
        expect(screen.getByText("Leave Calendar")).toBeInTheDocument();
    });

    it("navigates to previous month when Previous button is clicked", async () => {
        const user = userEvent.setup();
        (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
            data: mockLeaves,
            isLoading: false,
        });

        renderWithProviders(<LeaveCalendarPage />);

        const prevButton = screen.getByText("Previous");
        await user.click(prevButton);

        // Calendar should still be rendered after navigation
        expect(screen.getByText("Leave Calendar")).toBeInTheDocument();
    });

    it("returns to current month when Today button is clicked", async () => {
        const user = userEvent.setup();
        (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
            data: mockLeaves,
            isLoading: false,
        });

        renderWithProviders(<LeaveCalendarPage />);

        const todayButton = screen.getByText("Today");
        await user.click(todayButton);

        // Calendar should still be rendered after navigation
        expect(screen.getByText("Leave Calendar")).toBeInTheDocument();
    });
});
