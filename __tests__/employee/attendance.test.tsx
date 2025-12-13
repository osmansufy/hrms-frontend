import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AttendancePage from "@/app/dashboard/employee/attendance/page";
import * as sessionProvider from "@/components/auth/session-provider";
import * as attendanceQueries from "@/lib/queries/attendance";

// Mock session provider
jest.mock("@/components/auth/session-provider", () => ({
    useSession: jest.fn(),
}));

// Mock attendance queries
jest.mock("@/lib/queries/attendance", () => ({
    useTodayAttendance: jest.fn(),
    useSignIn: jest.fn(),
    useSignOut: jest.fn(),
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

describe("AttendancePage", () => {
    const mockSession = {
        user: { id: "user-1", email: "test@example.com", name: "Test User", roles: ["employee"] },
        token: "test-token",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (sessionProvider.useSession as jest.Mock).mockReturnValue({ session: mockSession });
    });

    it("renders the attendance page header", () => {
        (attendanceQueries.useTodayAttendance as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
            error: null,
            isFetching: false,
        });
        (attendanceQueries.useSignIn as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });
        (attendanceQueries.useSignOut as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });

        renderWithProviders(<AttendancePage />);

        expect(screen.getByText("Presence")).toBeInTheDocument();
        expect(screen.getByText("Attendance")).toBeInTheDocument();
    });

    it("shows 'Not signed in' status when no attendance data", () => {
        (attendanceQueries.useTodayAttendance as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
            error: null,
            isFetching: false,
        });
        (attendanceQueries.useSignIn as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });
        (attendanceQueries.useSignOut as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });

        renderWithProviders(<AttendancePage />);

        expect(screen.getAllByText("Not signed in")[0]).toBeInTheDocument();
    });

    it("shows 'Checking status…' while loading", () => {
        (attendanceQueries.useTodayAttendance as jest.Mock).mockReturnValue({
            data: null,
            isLoading: true,
            error: null,
            isFetching: true,
        });
        (attendanceQueries.useSignIn as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });
        (attendanceQueries.useSignOut as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });

        renderWithProviders(<AttendancePage />);

        expect(screen.getAllByText("Checking status…")[0]).toBeInTheDocument();
    });

    it("shows 'Signed in' status when user has signed in but not out", () => {
        (attendanceQueries.useTodayAttendance as jest.Mock).mockReturnValue({
            data: {
                signIn: "2025-12-12T09:00:00Z",
                signOut: null,
                isLate: false,
            },
            isLoading: false,
            error: null,
            isFetching: false,
        });
        (attendanceQueries.useSignIn as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });
        (attendanceQueries.useSignOut as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });

        renderWithProviders(<AttendancePage />);

        expect(screen.getAllByText("Signed in")[0]).toBeInTheDocument();
    });

    it("shows 'Signed out' status when user has completed attendance", () => {
        (attendanceQueries.useTodayAttendance as jest.Mock).mockReturnValue({
            data: {
                signIn: "2025-12-12T09:00:00Z",
                signOut: "2025-12-12T17:00:00Z",
                isLate: false,
            },
            isLoading: false,
            error: null,
            isFetching: false,
        });
        (attendanceQueries.useSignIn as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });
        (attendanceQueries.useSignOut as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });

        renderWithProviders(<AttendancePage />);

        expect(screen.getAllByText("Signed out")[0]).toBeInTheDocument();
    });

    it("shows late badge when user is late", () => {
        (attendanceQueries.useTodayAttendance as jest.Mock).mockReturnValue({
            data: {
                signIn: "2025-12-12T10:00:00Z",
                signOut: null,
                isLate: true,
            },
            isLoading: false,
            error: null,
            isFetching: false,
        });
        (attendanceQueries.useSignIn as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });
        (attendanceQueries.useSignOut as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });

        renderWithProviders(<AttendancePage />);

        expect(screen.getByText("Late")).toBeInTheDocument();
    });

    it("renders location input field", () => {
        (attendanceQueries.useTodayAttendance as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
            error: null,
            isFetching: false,
        });
        (attendanceQueries.useSignIn as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });
        (attendanceQueries.useSignOut as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });

        renderWithProviders(<AttendancePage />);

        expect(screen.getByPlaceholderText(/Remote \/ Office/)).toBeInTheDocument();
    });

    it("renders sign in and sign out buttons", () => {
        (attendanceQueries.useTodayAttendance as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
            error: null,
            isFetching: false,
        });
        (attendanceQueries.useSignIn as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });
        (attendanceQueries.useSignOut as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });

        renderWithProviders(<AttendancePage />);

        expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    });

    it("disables sign out button when not signed in", () => {
        (attendanceQueries.useTodayAttendance as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
            error: null,
            isFetching: false,
        });
        (attendanceQueries.useSignIn as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });
        (attendanceQueries.useSignOut as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });

        renderWithProviders(<AttendancePage />);

        expect(screen.getByRole("button", { name: /sign out/i })).toBeDisabled();
    });

    it("disables sign in button when already signed in", () => {
        (attendanceQueries.useTodayAttendance as jest.Mock).mockReturnValue({
            data: {
                signIn: "2025-12-12T09:00:00Z",
                signOut: null,
                isLate: false,
            },
            isLoading: false,
            error: null,
            isFetching: false,
        });
        (attendanceQueries.useSignIn as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });
        (attendanceQueries.useSignOut as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });

        renderWithProviders(<AttendancePage />);

        expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
        expect(screen.getByRole("button", { name: /sign out/i })).toBeEnabled();
    });

    it("calls sign in mutation when clicking sign in button", async () => {
        const user = userEvent.setup();
        const mockMutateAsync = jest.fn().mockResolvedValue({});

        (attendanceQueries.useTodayAttendance as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
            error: null,
            isFetching: false,
        });
        (attendanceQueries.useSignIn as jest.Mock).mockReturnValue({
            mutateAsync: mockMutateAsync,
            isLoading: false,
        });
        (attendanceQueries.useSignOut as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });

        renderWithProviders(<AttendancePage />);

        await user.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledWith({ location: undefined });
        });
    });

    it("shows error message when attendance fetch fails", () => {
        (attendanceQueries.useTodayAttendance as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
            error: new Error("Failed to fetch"),
            isFetching: false,
        });
        (attendanceQueries.useSignIn as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });
        (attendanceQueries.useSignOut as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
        });

        renderWithProviders(<AttendancePage />);

        expect(screen.getByText(/Unable to load today's attendance/)).toBeInTheDocument();
    });
});
