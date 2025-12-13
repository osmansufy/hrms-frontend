import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import UsersPage from "@/app/dashboard/admin/users/page";
import * as userQueries from "@/lib/queries/users";

// Mock user queries
jest.mock("@/lib/queries/users", () => ({
    useUsers: jest.fn(),
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

const mockUsers = [
    {
        id: "user-1",
        email: "admin@example.com",
        status: "ACTIVE",
        roleAssignments: [{ role: { code: "ADMIN" } }],
    },
    {
        id: "user-2",
        email: "employee@example.com",
        status: "ACTIVE",
        roleAssignments: [{ role: { code: "EMPLOYEE" } }],
    },
    {
        id: "user-3",
        email: "inactive@example.com",
        status: "INACTIVE",
        roles: ["USER"],
    },
];

describe("UsersPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the page header", () => {
        (userQueries.useUsers as jest.Mock).mockReturnValue({
            data: mockUsers,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UsersPage />);

        expect(screen.getByText("Admin · Users")).toBeInTheDocument();
        expect(screen.getByText("Users")).toBeInTheDocument();
    });

    it("renders users card", () => {
        (userQueries.useUsers as jest.Mock).mockReturnValue({
            data: mockUsers,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UsersPage />);

        expect(screen.getByText("All users")).toBeInTheDocument();
        expect(screen.getByText("Fetched from `/users`.")).toBeInTheDocument();
    });

    it("renders table headers", () => {
        (userQueries.useUsers as jest.Mock).mockReturnValue({
            data: mockUsers,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UsersPage />);

        expect(screen.getByText("Email")).toBeInTheDocument();
        expect(screen.getByText("Roles")).toBeInTheDocument();
    });

    it("renders all users in the table", () => {
        (userQueries.useUsers as jest.Mock).mockReturnValue({
            data: mockUsers,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UsersPage />);

        expect(screen.getByText("admin@example.com")).toBeInTheDocument();
        expect(screen.getByText("employee@example.com")).toBeInTheDocument();
        expect(screen.getByText("inactive@example.com")).toBeInTheDocument();
    });

    it("renders status badges", () => {
        (userQueries.useUsers as jest.Mock).mockReturnValue({
            data: mockUsers,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UsersPage />);

        const activeBadges = screen.getAllByText("ACTIVE");
        expect(activeBadges.length).toBe(2);
        expect(screen.getByText("INACTIVE")).toBeInTheDocument();
    });

    it("renders roles from roleAssignments", () => {
        (userQueries.useUsers as jest.Mock).mockReturnValue({
            data: mockUsers,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UsersPage />);

        expect(screen.getByText("ADMIN")).toBeInTheDocument();
        expect(screen.getByText("EMPLOYEE")).toBeInTheDocument();
    });

    it("renders roles from roles array as fallback", () => {
        (userQueries.useUsers as jest.Mock).mockReturnValue({
            data: mockUsers,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UsersPage />);

        expect(screen.getByText("USER")).toBeInTheDocument();
    });

    it("shows error state when fetch fails", () => {
        (userQueries.useUsers as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        });

        renderWithProviders(<UsersPage />);

        expect(screen.getByText("Unable to load users. Check token or permissions.")).toBeInTheDocument();
    });

    it("shows empty state when no users found", () => {
        (userQueries.useUsers as jest.Mock).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UsersPage />);

        expect(screen.getByText("No users found.")).toBeInTheDocument();
    });

    it("renders user email as link", () => {
        (userQueries.useUsers as jest.Mock).mockReturnValue({
            data: mockUsers,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<UsersPage />);

        const adminLink = screen.getByRole("link", { name: "admin@example.com" });
        expect(adminLink).toHaveAttribute("href", "/dashboard/admin/users/user-1");
    });
});
