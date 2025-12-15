import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import PendingApprovalsTab from "@/app/dashboard/employee/leave-manager/components/pending-approvals-tab";
import * as leaveQueries from "@/lib/queries/leave";

// Mock leave queries
jest.mock("@/lib/queries/leave", () => ({
    usePendingApprovals: jest.fn(),
    useApproveLeave: jest.fn(),
    useRejectLeave: jest.fn(),
    useBulkApproveLeaves: jest.fn(),
    useBulkRejectLeaves: jest.fn(),
    useLeaveStats: jest.fn(),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
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

const mockPendingLeaves = [
    {
        id: "leave-1",
        userId: "user-1",
        leaveTypeId: "lt-1",
        leaveType: { name: "Annual Leave" },
        user: { firstName: "John", lastName: "Doe", email: "john@example.com" },
        startDate: "2025-12-20",
        endDate: "2025-12-25",
        totalDays: 6,
        status: "PENDING",
        reason: "Holiday vacation",
        createdAt: "2025-12-01T00:00:00Z",
    },
    {
        id: "leave-2",
        userId: "user-2",
        leaveTypeId: "lt-2",
        leaveType: { name: "Sick Leave" },
        user: { firstName: "Jane", lastName: "Smith", email: "jane@example.com" },
        startDate: "2025-12-15",
        endDate: "2025-12-15",
        totalDays: 1,
        status: "PENDING",
        reason: "Doctor appointment",
        createdAt: "2025-12-10T00:00:00Z",
    },
    {
        id: "leave-3",
        userId: "user-3",
        leaveTypeId: "lt-3",
        leaveType: { name: "Personal Leave" },
        user: { firstName: "Bob", lastName: "Wilson", email: "bob@example.com" },
        startDate: "2025-12-18",
        endDate: "2025-12-19",
        totalDays: 2,
        status: "PENDING",
        reason: "Personal matter",
        createdAt: "2025-12-05T00:00:00Z",
    },
];

describe("PendingApprovalsTab - Bulk Operations", () => {
    const mockApproveMutate = jest.fn();
    const mockRejectMutate = jest.fn();
    const mockBulkApproveMutate = jest.fn();
    const mockBulkRejectMutate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (leaveQueries.useApproveLeave as jest.Mock).mockReturnValue({
            mutate: mockApproveMutate,
            isPending: false,
        });
        (leaveQueries.useRejectLeave as jest.Mock).mockReturnValue({
            mutate: mockRejectMutate,
            isPending: false,
        });
        (leaveQueries.useBulkApproveLeaves as jest.Mock).mockReturnValue({
            mutate: mockBulkApproveMutate,
            isPending: false,
        });
        (leaveQueries.useBulkRejectLeaves as jest.Mock).mockReturnValue({
            mutate: mockBulkRejectMutate,
            isPending: false,
        });
        (leaveQueries.useLeaveStats as jest.Mock).mockReturnValue({
            data: { pendingCount: 3, approvedCount: 10, rejectedCount: 2 },
            isLoading: false,
        });
    });

    it("renders select all checkbox", () => {
        (leaveQueries.usePendingApprovals as jest.Mock).mockReturnValue({
            data: mockPendingLeaves,
            isLoading: false,
        });

        renderWithProviders(<PendingApprovalsTab />);

        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBeGreaterThan(0);
    });

    it("renders individual checkboxes for each leave request", () => {
        (leaveQueries.usePendingApprovals as jest.Mock).mockReturnValue({
            data: mockPendingLeaves,
            isLoading: false,
        });

        renderWithProviders(<PendingApprovalsTab />);

        const checkboxes = screen.getAllByRole("checkbox");
        // Should have select-all + 3 individual checkboxes
        expect(checkboxes.length).toBe(4);
    });

    it("selects individual leave when checkbox is clicked", async () => {
        const user = userEvent.setup();
        (leaveQueries.usePendingApprovals as jest.Mock).mockReturnValue({
            data: mockPendingLeaves,
            isLoading: false,
        });

        renderWithProviders(<PendingApprovalsTab />);

        const checkboxes = screen.getAllByRole("checkbox");
        // Click first individual checkbox (skip select-all)
        await user.click(checkboxes[1]);

        // Checkbox should be checked
        expect(checkboxes[1]).toBeChecked();
    });

    it("selects all leaves when select-all checkbox is clicked", async () => {
        const user = userEvent.setup();
        (leaveQueries.usePendingApprovals as jest.Mock).mockReturnValue({
            data: mockPendingLeaves,
            isLoading: false,
        });

        renderWithProviders(<PendingApprovalsTab />);

        const checkboxes = screen.getAllByRole("checkbox");
        // Click select-all checkbox (first one)
        await user.click(checkboxes[0]);

        // All checkboxes should be checked
        checkboxes.forEach(checkbox => {
            expect(checkbox).toBeChecked();
        });
    });

    it("shows bulk action buttons when leaves are selected", async () => {
        const user = userEvent.setup();
        (leaveQueries.usePendingApprovals as jest.Mock).mockReturnValue({
            data: mockPendingLeaves,
            isLoading: false,
        });

        renderWithProviders(<PendingApprovalsTab />);

        const checkboxes = screen.getAllByRole("checkbox");
        // Select first leave
        await user.click(checkboxes[1]);

        expect(screen.getByText(/Approve Selected/)).toBeInTheDocument();
        expect(screen.getByText(/Reject Selected/)).toBeInTheDocument();
    });

    it("displays count of selected leaves", async () => {
        const user = userEvent.setup();
        (leaveQueries.usePendingApprovals as jest.Mock).mockReturnValue({
            data: mockPendingLeaves,
            isLoading: false,
        });

        renderWithProviders(<PendingApprovalsTab />);

        const checkboxes = screen.getAllByRole("checkbox");
        // Select two leaves
        await user.click(checkboxes[1]);
        await user.click(checkboxes[2]);

        expect(screen.getByText(/2 selected/)).toBeInTheDocument();
    });

    it("shows confirmation dialog when bulk approve is clicked", async () => {
        const user = userEvent.setup();
        (leaveQueries.usePendingApprovals as jest.Mock).mockReturnValue({
            data: mockPendingLeaves,
            isLoading: false,
        });

        renderWithProviders(<PendingApprovalsTab />);

        const checkboxes = screen.getAllByRole("checkbox");
        await user.click(checkboxes[1]);

        const bulkApproveButton = screen.getByText(/Approve Selected/);
        await user.click(bulkApproveButton);

        await waitFor(() => {
            expect(screen.getByText(/Confirm Bulk Approval/)).toBeInTheDocument();
        });
    });

    it("shows confirmation dialog when bulk reject is clicked", async () => {
        const user = userEvent.setup();
        (leaveQueries.usePendingApprovals as jest.Mock).mockReturnValue({
            data: mockPendingLeaves,
            isLoading: false,
        });

        renderWithProviders(<PendingApprovalsTab />);

        const checkboxes = screen.getAllByRole("checkbox");
        await user.click(checkboxes[1]);

        const bulkRejectButton = screen.getByText(/Reject Selected/);
        await user.click(bulkRejectButton);

        await waitFor(() => {
            expect(screen.getByText(/Confirm Bulk Rejection/)).toBeInTheDocument();
        });
    });

    it("calls bulk approve mutation with selected leave IDs", async () => {
        const user = userEvent.setup();
        (leaveQueries.usePendingApprovals as jest.Mock).mockReturnValue({
            data: mockPendingLeaves,
            isLoading: false,
        });

        renderWithProviders(<PendingApprovalsTab />);

        const checkboxes = screen.getAllByRole("checkbox");
        await user.click(checkboxes[1]);
        await user.click(checkboxes[2]);

        const bulkApproveButton = screen.getByText(/Approve Selected/);
        await user.click(bulkApproveButton);

        // Wait for confirmation dialog
        await waitFor(() => {
            expect(screen.getByText(/Confirm Bulk Approval/)).toBeInTheDocument();
        });

        // Click confirm button
        const confirmButton = screen.getByRole("button", { name: /Approve/ });
        await user.click(confirmButton);

        await waitFor(() => {
            expect(mockBulkApproveMutate).toHaveBeenCalledWith(
                expect.objectContaining({
                    leaveIds: expect.arrayContaining(["leave-1", "leave-2"]),
                })
            );
        });
    });

    it("calls bulk reject mutation with selected leave IDs", async () => {
        const user = userEvent.setup();
        (leaveQueries.usePendingApprovals as jest.Mock).mockReturnValue({
            data: mockPendingLeaves,
            isLoading: false,
        });

        renderWithProviders(<PendingApprovalsTab />);

        const checkboxes = screen.getAllByRole("checkbox");
        await user.click(checkboxes[1]);

        const bulkRejectButton = screen.getByText(/Reject Selected/);
        await user.click(bulkRejectButton);

        // Wait for confirmation dialog
        await waitFor(() => {
            expect(screen.getByText(/Confirm Bulk Rejection/)).toBeInTheDocument();
        });

        // Click confirm button
        const confirmButton = screen.getByRole("button", { name: /Reject/ });
        await user.click(confirmButton);

        await waitFor(() => {
            expect(mockBulkRejectMutate).toHaveBeenCalledWith(
                expect.objectContaining({
                    leaveIds: expect.arrayContaining(["leave-1"]),
                })
            );
        });
    });

    it("clears selection after successful bulk approval", async () => {
        const user = userEvent.setup();
        mockBulkApproveMutate.mockImplementation((data, { onSuccess }) => {
            onSuccess();
        });

        (leaveQueries.usePendingApprovals as jest.Mock).mockReturnValue({
            data: mockPendingLeaves,
            isLoading: false,
        });

        renderWithProviders(<PendingApprovalsTab />);

        const checkboxes = screen.getAllByRole("checkbox");
        await user.click(checkboxes[1]);

        const bulkApproveButton = screen.getByText(/Approve Selected/);
        await user.click(bulkApproveButton);

        await waitFor(() => {
            expect(screen.getByText(/Confirm Bulk Approval/)).toBeInTheDocument();
        });

        const confirmButton = screen.getByRole("button", { name: /Approve/ });
        await user.click(confirmButton);

        await waitFor(() => {
            expect(mockBulkApproveMutate).toHaveBeenCalled();
        });
    });

    it("displays leave details in confirmation dialog", async () => {
        const user = userEvent.setup();
        (leaveQueries.usePendingApprovals as jest.Mock).mockReturnValue({
            data: mockPendingLeaves,
            isLoading: false,
        });

        renderWithProviders(<PendingApprovalsTab />);

        const checkboxes = screen.getAllByRole("checkbox");
        await user.click(checkboxes[1]);

        const bulkApproveButton = screen.getByText(/Approve Selected/);
        await user.click(bulkApproveButton);

        await waitFor(() => {
            expect(screen.getByText(/John Doe/)).toBeInTheDocument();
            expect(screen.getByText(/Annual Leave/)).toBeInTheDocument();
        });
    });

    it("disables bulk action buttons while mutation is pending", async () => {
        (leaveQueries.useBulkApproveLeaves as jest.Mock).mockReturnValue({
            mutate: mockBulkApproveMutate,
            isPending: true,
        });
        (leaveQueries.usePendingApprovals as jest.Mock).mockReturnValue({
            data: mockPendingLeaves,
            isLoading: false,
        });

        const user = userEvent.setup();
        renderWithProviders(<PendingApprovalsTab />);

        const checkboxes = screen.getAllByRole("checkbox");
        await user.click(checkboxes[1]);

        const bulkApproveButton = screen.getByText(/Approve Selected/);
        expect(bulkApproveButton).toBeDisabled();
    });
});
