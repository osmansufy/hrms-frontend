import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import LeavePoliciesPage from "@/app/dashboard/employee/leave/policies/page";
import * as leaveQueries from "@/lib/queries/leave";

// Mock leave queries
jest.mock("@/lib/queries/leave", () => ({
    useMyLeavePolicies: jest.fn(),
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

const mockPolicies = [
    {
        id: "policy-1",
        leaveTypeId: "lt-1",
        leaveTypeName: "Annual Leave",
        leaveTypeCode: "AL",
        daysPerYear: 20,
        maxConsecutiveDays: 10,
        minNoticeDays: 7,
        allowCarryForward: true,
        maxCarryForwardDays: 5,
        carryForwardExpiryMonths: 3,
        requiresApproval: true,
        isActive: true,
    },
    {
        id: "policy-2",
        leaveTypeId: "lt-2",
        leaveTypeName: "Sick Leave",
        leaveTypeCode: "SL",
        daysPerYear: 10,
        maxConsecutiveDays: 5,
        minNoticeDays: 0,
        allowCarryForward: false,
        maxCarryForwardDays: null,
        carryForwardExpiryMonths: null,
        requiresApproval: true,
        isActive: true,
    },
    {
        id: "policy-3",
        leaveTypeId: "lt-3",
        leaveTypeName: "Personal Leave",
        leaveTypeCode: "PL",
        daysPerYear: 5,
        maxConsecutiveDays: 3,
        minNoticeDays: 3,
        allowCarryForward: false,
        maxCarryForwardDays: null,
        carryForwardExpiryMonths: null,
        requiresApproval: true,
        isActive: true,
    },
];

describe("LeavePoliciesPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders page header", () => {
        (leaveQueries.useMyLeavePolicies as jest.Mock).mockReturnValue({
            data: mockPolicies,
            isLoading: false,
        });

        renderWithProviders(<LeavePoliciesPage />);

        expect(screen.getByText("Leave Policies")).toBeInTheDocument();
    });

    it("displays all leave policies", () => {
        (leaveQueries.useMyLeavePolicies as jest.Mock).mockReturnValue({
            data: mockPolicies,
            isLoading: false,
        });

        renderWithProviders(<LeavePoliciesPage />);

        expect(screen.getByText("Annual Leave")).toBeInTheDocument();
        expect(screen.getByText("Sick Leave")).toBeInTheDocument();
        expect(screen.getByText("Personal Leave")).toBeInTheDocument();
    });

    it("displays policy entitlements", () => {
        (leaveQueries.useMyLeavePolicies as jest.Mock).mockReturnValue({
            data: mockPolicies,
            isLoading: false,
        });

        renderWithProviders(<LeavePoliciesPage />);

        expect(screen.getByText("20 days per year")).toBeInTheDocument();
        expect(screen.getByText("10 days per year")).toBeInTheDocument();
        expect(screen.getByText("5 days per year")).toBeInTheDocument();
    });

    it("displays notice period requirements", () => {
        (leaveQueries.useMyLeavePolicies as jest.Mock).mockReturnValue({
            data: mockPolicies,
            isLoading: false,
        });

        renderWithProviders(<LeavePoliciesPage />);

        expect(screen.getByText(/7 days/)).toBeInTheDocument();
        expect(screen.getByText(/No notice/)).toBeInTheDocument();
        expect(screen.getByText(/3 days/)).toBeInTheDocument();
    });

    it("displays carry forward information for applicable policies", () => {
        (leaveQueries.useMyLeavePolicies as jest.Mock).mockReturnValue({
            data: mockPolicies,
            isLoading: false,
        });

        renderWithProviders(<LeavePoliciesPage />);

        expect(screen.getByText(/5 days/)).toBeInTheDocument();
        expect(screen.getByText(/3 months/)).toBeInTheDocument();
    });

    it("displays maximum consecutive days", () => {
        (leaveQueries.useMyLeavePolicies as jest.Mock).mockReturnValue({
            data: mockPolicies,
            isLoading: false,
        });

        renderWithProviders(<LeavePoliciesPage />);

        expect(screen.getByText(/10 consecutive/)).toBeInTheDocument();
        expect(screen.getByText(/5 consecutive/)).toBeInTheDocument();
        expect(screen.getByText(/3 consecutive/)).toBeInTheDocument();
    });

    it("shows loading state", () => {
        (leaveQueries.useMyLeavePolicies as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: true,
        });

        renderWithProviders(<LeavePoliciesPage />);

        expect(screen.getByText("Loading policies...")).toBeInTheDocument();
    });

    it("shows empty state when no policies exist", () => {
        (leaveQueries.useMyLeavePolicies as jest.Mock).mockReturnValue({
            data: [],
            isLoading: false,
        });

        renderWithProviders(<LeavePoliciesPage />);

        expect(screen.getByText(/No leave policies/)).toBeInTheDocument();
    });

    it("renders policy cards in a grid layout", () => {
        (leaveQueries.useMyLeavePolicies as jest.Mock).mockReturnValue({
            data: mockPolicies,
            isLoading: false,
        });

        const { container } = renderWithProviders(<LeavePoliciesPage />);

        const grid = container.querySelector(".grid");
        expect(grid).toBeInTheDocument();
    });
});
