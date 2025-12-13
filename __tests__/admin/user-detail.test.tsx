import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import UserDetailPage from "@/app/dashboard/admin/users/[id]/page";
import * as userQueries from "@/lib/queries/users";

// Mock next/navigation
jest.mock("next/navigation", () => ({
    useParams: jest.fn(),
}));

// Mock user queries
jest.mock("@/lib/queries/users", () => ({
    useUser: jest.fn(),
}));

import { useParams } from "next/navigation";

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

const mockUser = {
    id: "user-1",
    email: "admin@example.com",
    name: "Admin User",
    status: "ACTIVE",
    roleAssignments: [
        { role: { code: "ADMIN" } },
        { role: { code: "SUPER_ADMIN" } },
    ],
};

describe("UserDetailPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useParams as jest.Mock).mockReturnValue({ id: "user-1" });
    });

    it("shows invalid id message when id is missing", () => {
        (useParams as jest.Mock).mockReturnValue({ id: undefined });
        // Mock useUser to return empty state (component returns early anyway)
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        expect(screen.getByText("Invalid user id")).toBeInTheDocument();
    });

    it("shows loading state while fetching user", () => {
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        expect(screen.getByText("Loading user...")).toBeInTheDocument();
    });

    it("shows not found state when user does not exist", () => {
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        expect(screen.getByText("User not found")).toBeInTheDocument();
        expect(screen.getByText("Back to users")).toBeInTheDocument();
    });

    it("shows not found state on error", () => {
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
            isError: true,
        });

        renderWithProviders(<UserDetailPage />);

        expect(screen.getByText("User not found")).toBeInTheDocument();
    });

    it("renders user email as heading", () => {
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: mockUser,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        // Email appears multiple times (heading + detail), use getAllByText
        const emailElements = screen.getAllByText("admin@example.com");
        expect(emailElements.length).toBeGreaterThan(0);
    });

    it("renders back link", () => {
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: mockUser,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("renders user details card", () => {
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: mockUser,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        expect(screen.getByText("User details")).toBeInTheDocument();
        expect(screen.getByText("From `/users/:id`.")).toBeInTheDocument();
    });

    it("renders user info labels", () => {
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: mockUser,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        expect(screen.getByText("Email")).toBeInTheDocument();
        expect(screen.getByText("Roles")).toBeInTheDocument();
    });

    it("renders user status as badge", () => {
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: mockUser,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    });

    it("renders user roles from roleAssignments", () => {
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: mockUser,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        expect(screen.getByText("ADMIN, SUPER_ADMIN")).toBeInTheDocument();
    });

    it("renders user name", () => {
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: mockUser,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    it("shows dash for missing name", () => {
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: { ...mockUser, name: null },
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        const dashes = screen.getAllByText("—");
        expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it("falls back to roles array when roleAssignments is empty", () => {
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: { ...mockUser, roleAssignments: [], roles: ["USER", "VIEWER"] },
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        expect(screen.getByText("USER, VIEWER")).toBeInTheDocument();
    });

    it("shows dash when no roles", () => {
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: { ...mockUser, roleAssignments: [], roles: [] },
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        const dashes = screen.getAllByText("—");
        expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it("handles array id parameter", () => {
        (useParams as jest.Mock).mockReturnValue({ id: ["user-1", "extra"] });
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: mockUser,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        // Email may appear multiple times, use getAllByText
        const emailElements = screen.getAllByText("admin@example.com");
        expect(emailElements.length).toBeGreaterThan(0);
    });

    it("shows UNKNOWN status when status is missing", () => {
        (userQueries.useUser as jest.Mock).mockReturnValue({
            data: { ...mockUser, status: null },
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UserDetailPage />);

        expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
    });
});
