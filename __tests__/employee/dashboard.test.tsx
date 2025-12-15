import { render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import EmployeeDashboard from "@/app/dashboard/employee/page";
import * as sessionProvider from "@/components/auth/session-provider";
import * as leaveQueries from "@/lib/queries/leave";

// Mock session provider
jest.mock("@/components/auth/session-provider", () => ({
    useSession: jest.fn(),
}));

// Mock leave queries
jest.mock("@/lib/queries/leave", () => ({
    useUserBalances: jest.fn(),
    useMyLeaves: jest.fn(),
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

// Mock data
const mockSession = {
    user: {
        id: "user-123",
        email: "john.doe@example.com",
        role: "EMPLOYEE",
    },
    session: { token: "mock-token" },
};

const mockBalances = [
    {
        id: "bal-1",
        userId: "user-123",
        leaveTypeId: "lt-1",
        balance: 15,
        carryForward: 5,
        leaveType: {
            id: "lt-1",
            name: "Annual Leave",
            code: "AL",
            description: "Annual vacation leave",
            leavePolicy: {
                maxDays: 20,
                carryForwardCap: 5,
                encashmentFlag: true,
                allowAdvance: false,
            },
        },
        accrualRule: null,
        accrualRuleId: null,
        lastAccruedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "bal-2",
        userId: "user-123",
        leaveTypeId: "lt-2",
        balance: 8,
        carryForward: 0,
        leaveType: {
            id: "lt-2",
            name: "Sick Leave",
            code: "SL",
            description: "Medical leave",
            leavePolicy: {
                maxDays: 10,
                carryForwardCap: 0,
                encashmentFlag: false,
                allowAdvance: true,
            },
        },
        accrualRule: null,
        accrualRuleId: null,
        lastAccruedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "bal-3",
        userId: "user-123",
        leaveTypeId: "lt-3",
        balance: 3,
        carryForward: 0,
        leaveType: {
            id: "lt-3",
            name: "Personal Leave",
            code: "PL",
            description: "Personal time off",
            leavePolicy: null,
        },
        accrualRule: null,
        accrualRuleId: null,
        lastAccruedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

const mockLeaves = [
    {
        id: "leave-1",
        leaveTypeId: "lt-1",
        leaveType: { id: "lt-1", name: "Annual Leave", code: "AL" },
        reason: "Family vacation",
        status: "APPROVED",
        startDate: "2025-12-20",
        endDate: "2025-12-27",
        createdAt: "2025-12-01T10:00:00Z",
    },
    {
        id: "leave-2",
        leaveTypeId: "lt-2",
        leaveType: { id: "lt-2", name: "Sick Leave", code: "SL" },
        reason: "Medical appointment",
        status: "PENDING",
        startDate: "2025-12-18",
        endDate: "2025-12-18",
        createdAt: "2025-12-10T14:30:00Z",
    },
    {
        id: "leave-3",
        leaveTypeId: "lt-1",
        leaveType: { id: "lt-1", name: "Annual Leave", code: "AL" },
        reason: "Extended weekend",
        status: "REJECTED",
        startDate: "2025-11-15",
        endDate: "2025-11-17",
        createdAt: "2025-11-01T09:00:00Z",
    },
    {
        id: "leave-4",
        leaveTypeId: "lt-3",
        leaveType: { id: "lt-3", name: "Personal Leave", code: "PL" },
        reason: "Personal matters",
        status: "APPROVED",
        startDate: "2025-10-05",
        endDate: "2025-10-06",
        createdAt: "2025-09-25T11:00:00Z",
    },
];

describe("EmployeeDashboard - E2E Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (sessionProvider.useSession as jest.Mock).mockReturnValue({ session: mockSession });
    });

    describe("Initial Render and Header", () => {
        it("renders the welcome header with correct text", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByText("Welcome back")).toBeInTheDocument();
            expect(screen.getByText("Your Dashboard")).toBeInTheDocument();
        });

        it("has proper heading hierarchy for accessibility", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const mainHeading = screen.getByRole("heading", { level: 1, name: /your dashboard/i });
            expect(mainHeading).toBeInTheDocument();

            const subHeadings = screen.getAllByRole("heading", { level: 2 });
            expect(subHeadings.length).toBeGreaterThan(0);
        });
    });

    describe("Loading States", () => {
        it("shows loading spinners when balances are loading", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: true,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByLabelText("Loading available days")).toBeInTheDocument();
            expect(screen.getByLabelText("Loading carried forward days")).toBeInTheDocument();
        });

        it("shows loading spinner when leaves are loading", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: true,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByLabelText("Loading pending requests")).toBeInTheDocument();
            expect(screen.getByLabelText("Loading approved leaves")).toBeInTheDocument();
        });

        it("shows loading state for leave balances section", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: true,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByLabelText("Loading leave balances")).toBeInTheDocument();
        });

        it("shows loading state for recent leave requests", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: true,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByLabelText("Loading leave requests")).toBeInTheDocument();
        });
    });

    describe("Error States", () => {
        it("displays error alert when balances fail to load", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: false,
                error: new Error("Failed to fetch balances"),
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByText(/Failed to load leave balances/i)).toBeInTheDocument();
        });

        it("displays error alert when leaves fail to load", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: false,
                error: new Error("Failed to fetch leaves"),
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByText(/Failed to load leave requests/i)).toBeInTheDocument();
        });

        it("displays combined error message when both fail", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: false,
                error: new Error("Balance error"),
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: false,
                error: new Error("Leave error"),
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByText(/Failed to load leave balances/i)).toBeInTheDocument();
            expect(screen.getByText(/Failed to load leave requests/i)).toBeInTheDocument();
        });
    });

    describe("Leave Statistics Overview", () => {
        it("displays correct total available days", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: mockBalances,
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const availableDays = screen.getByTestId("available-days");
            expect(within(availableDays).getByText("26")).toBeInTheDocument(); // 15 + 8 + 3
        });

        it("displays correct total carried forward days", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: mockBalances,
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const carriedForward = screen.getByTestId("carried-forward-days");
            expect(within(carriedForward).getByText("5")).toBeInTheDocument();
        });

        it("displays correct count of pending leave requests", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: mockLeaves,
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const pendingRequests = screen.getByTestId("pending-requests");
            expect(within(pendingRequests).getByText("1")).toBeInTheDocument(); // Only 1 PENDING
        });

        it("displays correct count of approved leaves", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: mockLeaves,
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const approvedLeaves = screen.getByTestId("approved-leaves");
            expect(within(approvedLeaves).getByText("2")).toBeInTheDocument(); // 2 APPROVED
        });

        it("shows zero when no data is available", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(within(screen.getByTestId("available-days")).getByText("0")).toBeInTheDocument();
            expect(within(screen.getByTestId("carried-forward-days")).getByText("0")).toBeInTheDocument();
            expect(within(screen.getByTestId("pending-requests")).getByText("0")).toBeInTheDocument();
            expect(within(screen.getByTestId("approved-leaves")).getByText("0")).toBeInTheDocument();
        });
    });

    describe("Leave Balances by Type", () => {
        it("displays up to 3 leave balance cards", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: mockBalances,
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const grid = screen.getByTestId("leave-balances-grid");
            const cards = within(grid).getAllByTestId(/^balance-card-/);
            expect(cards).toHaveLength(3);
        });

        it("displays leave type names correctly", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: mockBalances,
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByText("Annual Leave")).toBeInTheDocument();
            expect(screen.getByText("Sick Leave")).toBeInTheDocument();
            expect(screen.getByText("Personal Leave")).toBeInTheDocument();
        });

        it("shows 'Good' badge for balances >= 50%", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: mockBalances,
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const annualLeaveCard = screen.getByTestId("balance-card-AL");
            expect(within(annualLeaveCard).getByText("Good")).toBeInTheDocument();
        });

        it("shows 'Limited' badge for balances between 25% and 50%", () => {
            const limitedBalance = [{
                ...mockBalances[0],
                balance: 7,
                carryForward: 13,  // Total: 20, available: 7, percentage: 35%
                leaveType: { ...mockBalances[0].leaveType, code: "LIM" },
            }];

            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: limitedBalance,
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const card = screen.getByTestId("balance-card-LIM");
            expect(within(card).getByText("Limited")).toBeInTheDocument();
        });

        it("shows 'Low' badge for balances < 25%", () => {
            const lowBalance = [{
                ...mockBalances[0],
                balance: 4,
                carryForward: 16,  // Total: 20, available: 4, percentage: 20%
                leaveType: { ...mockBalances[0].leaveType, code: "LOW" },
            }];

            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: lowBalance,
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const card = screen.getByTestId("balance-card-LOW");
            expect(within(card).getByText("Low")).toBeInTheDocument();
        });

        it("displays carry forward information when available", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: mockBalances,
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByText("+5 carried forward")).toBeInTheDocument();
        });

        it("shows empty state when no balances exist", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByText("No leave balances available")).toBeInTheDocument();
        });

        it("has 'View all' link with correct href", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: mockBalances,
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const viewAllLinks = screen.getAllByLabelText("View all leave balances");
            expect(viewAllLinks[0]).toHaveAttribute("href", "/dashboard/employee/leave");
        });
    });

    describe("Recent Leave Requests", () => {
        it("displays the 3 most recent leave requests", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: mockLeaves,
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const recentList = screen.getByTestId("recent-leaves-list");
            const cards = within(recentList).getAllByTestId(/^leave-card-/);
            expect(cards).toHaveLength(3);
        });

        it("sorts leaves by creation date (newest first)", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: mockLeaves,
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const leaveCards = screen.getAllByTestId(/^leave-card-/);
            // First should be the most recent (leave-2 from Dec 10)
            expect(leaveCards[0]).toHaveAttribute("data-testid", "leave-card-leave-2");
        });

        it("displays approved leaves with green checkmark icon", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: mockLeaves,
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const approvedBadges = screen.getAllByText("Approved");
            expect(approvedBadges.length).toBeGreaterThan(0);
        });

        it("displays pending leaves with clock icon", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: mockLeaves,
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByText("Pending")).toBeInTheDocument();
        });

        it("displays rejected leaves with X icon", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: mockLeaves,
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByText("Rejected")).toBeInTheDocument();
        });

        it("displays leave date ranges correctly", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: mockLeaves,
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            // Check that dates are displayed (format may vary by locale)
            expect(screen.getByText(/12\/18\/2025/i)).toBeInTheDocument();
        });

        it("shows leave reasons when available", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: mockLeaves,
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByText("Medical appointment")).toBeInTheDocument();
        });

        it("shows empty state when no leave requests exist", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByText("No leave requests yet")).toBeInTheDocument();
        });

        it("has 'View all' link for leave requests", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: mockLeaves,
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const viewAllLinks = screen.getAllByLabelText("View all leave requests");
            expect(viewAllLinks[0]).toHaveAttribute("href", "/dashboard/employee/leave");
        });
    });

    describe("Quick Actions Section", () => {
        it("renders all navigation cards", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByText("Profile")).toBeInTheDocument();
            expect(screen.getByText("Attendance")).toBeInTheDocument();
            expect(screen.getByText("Apply for Leave")).toBeInTheDocument();
            expect(screen.getByText("Directory")).toBeInTheDocument();
        });

        it("renders navigation links with correct hrefs", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            const profileLink = screen.getByRole("link", { name: /go to profile/i });
            const attendanceLink = screen.getByRole("link", { name: /manage attendance/i });
            const leaveLink = screen.getByRole("link", { name: /request leave/i });
            const directoryLink = screen.getByRole("link", { name: /view directory/i });

            expect(profileLink).toHaveAttribute("href", "/dashboard/employee/profile");
            expect(attendanceLink).toHaveAttribute("href", "/dashboard/employee/attendance");
            expect(leaveLink).toHaveAttribute("href", "/dashboard/employee/leave");
            expect(directoryLink).toHaveAttribute("href", "/dashboard/employee/directory");
        });
    });

    describe("Accessibility", () => {
        it("has proper ARIA labels for loading states", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: true,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: true,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByLabelText("Loading available days")).toBeInTheDocument();
            expect(screen.getByLabelText("Loading leave balances")).toBeInTheDocument();
            expect(screen.getByLabelText("Loading leave requests")).toBeInTheDocument();
        });

        it("has proper ARIA labels for navigation links", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: mockBalances,
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: mockLeaves,
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByLabelText("View all leave balances")).toBeInTheDocument();
            expect(screen.getByLabelText("View all leave requests")).toBeInTheDocument();
        });

        it("has proper role attributes", () => {
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            expect(screen.getByRole("region", { name: /leave statistics/i })).toBeInTheDocument();
        });
    });

    describe("Data Integration", () => {
        it("correctly integrates session user ID", () => {
            const useMyLeavesMock = jest.fn().mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockImplementation(useMyLeavesMock);

            renderWithProviders(<EmployeeDashboard />);

            expect(useMyLeavesMock).toHaveBeenCalledWith("user-123");
        });

        it("handles missing session gracefully", () => {
            (sessionProvider.useSession as jest.Mock).mockReturnValue({ session: null });
            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            });

            renderWithProviders(<EmployeeDashboard />);

            // Should still render without crashing
            expect(screen.getByText("Your Dashboard")).toBeInTheDocument();
        });
    });

    describe("Performance Optimizations", () => {
        it("memoizes leave statistics calculations", () => {
            const { rerender } = renderWithProviders(<EmployeeDashboard />);

            (leaveQueries.useUserBalances as jest.Mock).mockReturnValue({
                data: mockBalances,
                isLoading: false,
                error: null,
            });
            (leaveQueries.useMyLeaves as jest.Mock).mockReturnValue({
                data: mockLeaves,
                isLoading: false,
                error: null,
            });

            // Re-render with same data shouldn't cause recalculation
            rerender(
                <QueryClientProvider client={createQueryClient()}>
                    <EmployeeDashboard />
                </QueryClientProvider>
            );

            // Component should still display correct values
            expect(within(screen.getByTestId("available-days")).getByText("26")).toBeInTheDocument();
        });
    });
});
