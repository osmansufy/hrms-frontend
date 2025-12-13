import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import DirectoryPage from "@/app/dashboard/employee/directory/page";
import * as employeeQueries from "@/lib/queries/employees";

// Mock employees query
jest.mock("@/lib/queries/employees", () => ({
    useEmployees: jest.fn(),
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

const mockEmployees = [
    {
        id: "1",
        name: "John Doe",
        title: "Software Engineer",
        department: "Engineering",
        location: "Remote",
        status: "Active",
        email: "john@example.com",
    },
    {
        id: "2",
        name: "Jane Smith",
        title: "Product Manager",
        department: "Product",
        location: "Office",
        status: "Active",
        email: "jane@example.com",
    },
    {
        id: "3",
        name: "Bob Wilson",
        title: "Designer",
        department: "Design",
        location: "Remote",
        status: "On Leave",
        email: "bob@example.com",
    },
];

describe("DirectoryPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the directory page header", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
        });

        renderWithProviders(<DirectoryPage />);

        expect(screen.getByText("People")).toBeInTheDocument();
        expect(screen.getByText("Employee directory")).toBeInTheDocument();
    });

    it("shows loading state while fetching employees", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: true,
        });

        renderWithProviders(<DirectoryPage />);

        expect(screen.getByText("Loading directory...")).toBeInTheDocument();
    });

    it("renders employee count badge", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
        });

        renderWithProviders(<DirectoryPage />);

        expect(screen.getByText("3 people")).toBeInTheDocument();
    });

    it("renders search input", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
        });

        renderWithProviders(<DirectoryPage />);

        expect(screen.getByPlaceholderText(/Search by name, email, department/i)).toBeInTheDocument();
    });

    it("renders employee table with correct headers", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
        });

        renderWithProviders(<DirectoryPage />);

        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Title")).toBeInTheDocument();
        expect(screen.getByText("Department")).toBeInTheDocument();
        expect(screen.getByText("Location")).toBeInTheDocument();
        expect(screen.getByText("Status")).toBeInTheDocument();
        expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("renders all employees in the table", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
        });

        renderWithProviders(<DirectoryPage />);

        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
    });

    it("renders employee details correctly", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
        });

        renderWithProviders(<DirectoryPage />);

        expect(screen.getByText("Software Engineer")).toBeInTheDocument();
        expect(screen.getByText("Engineering")).toBeInTheDocument();
        expect(screen.getByText("Product Manager")).toBeInTheDocument();
        expect(screen.getByText("Product")).toBeInTheDocument();
    });

    it("renders status badges for employees", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
        });

        renderWithProviders(<DirectoryPage />);

        // Get all Active badges (there should be 2)
        const activeBadges = screen.getAllByText("Active");
        expect(activeBadges).toHaveLength(2);

        expect(screen.getByText("On Leave")).toBeInTheDocument();
    });

    it("renders view buttons for each employee", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
        });

        renderWithProviders(<DirectoryPage />);

        const viewButtons = screen.getAllByRole("link", { name: /view/i });
        expect(viewButtons).toHaveLength(3);
    });

    it("view buttons have correct hrefs", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
        });

        renderWithProviders(<DirectoryPage />);

        const viewButtons = screen.getAllByRole("link", { name: /view/i });
        expect(viewButtons[0]).toHaveAttribute("href", "/dashboard/employee/directory/1");
        expect(viewButtons[1]).toHaveAttribute("href", "/dashboard/employee/directory/2");
        expect(viewButtons[2]).toHaveAttribute("href", "/dashboard/employee/directory/3");
    });

    it("updates search when typing in search input", async () => {
        const user = userEvent.setup();
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
        });

        renderWithProviders(<DirectoryPage />);

        const searchInput = screen.getByPlaceholderText(/Search by name, email, department/i);
        await user.type(searchInput, "John");

        expect(searchInput).toHaveValue("John");
    });

    it("renders empty table when no employees", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: [],
            isLoading: false,
        });

        renderWithProviders(<DirectoryPage />);

        expect(screen.getByText("0 people")).toBeInTheDocument();
    });

    it("renders add employee button", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
        });

        renderWithProviders(<DirectoryPage />);

        expect(screen.getByRole("link", { name: /add employee/i })).toBeInTheDocument();
    });
});
