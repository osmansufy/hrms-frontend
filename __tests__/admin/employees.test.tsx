import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AdminEmployeesPage from "@/app/dashboard/admin/employees/page";
import * as employeeQueries from "@/lib/queries/employees";

// Mock employee queries
jest.mock("@/lib/queries/employees", () => ({
    useEmployees: jest.fn(),
    useManagers: jest.fn(),
    useAssignManager: jest.fn(),
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
        id: "emp-1",
        employeeCode: "EMP001",
        name: "John Doe",
        email: "john@example.com",
        department: "Engineering",
        title: "Software Engineer",
        location: "Full Time",
        status: "Active",
    },
    {
        id: "emp-2",
        employeeCode: "EMP002",
        name: "Jane Smith",
        email: "jane@example.com",
        department: "HR",
        title: "HR Manager",
        location: "Full Time",
        status: "On Leave",
    },
    {
        id: "emp-3",
        employeeCode: null,
        name: "Bob Wilson",
        email: "bob@example.com",
        department: "Design",
        title: "Designer",
        location: "Part Time",
        status: "Inactive",
    },
];

describe("AdminEmployeesPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock useManagers
        (employeeQueries.useManagers as jest.Mock).mockReturnValue({
            data: [],
            isLoading: false,
        });
        // Mock useAssignManager
        (employeeQueries.useAssignManager as jest.Mock).mockReturnValue({
            mutate: jest.fn(),
            isPending: false,
        });
    });

    it("renders the page header", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeesPage />);

        expect(screen.getByText("People Operations")).toBeInTheDocument();
        expect(screen.getByText("Employees")).toBeInTheDocument();
    });

    it("renders create employee button", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeesPage />);

        const createButton = screen.getByRole("link", { name: /create employee/i });
        expect(createButton).toBeInTheDocument();
        expect(createButton).toHaveAttribute("href", "/dashboard/admin/employees/create");
    });

    it("renders search input", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeesPage />);

        expect(screen.getByPlaceholderText(/Search by code, name, phone, email/i)).toBeInTheDocument();
    });

    it("renders filter inputs", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeesPage />);

        expect(screen.getByPlaceholderText("Filter by departmentId")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Filter by designationId")).toBeInTheDocument();
    });

    it("shows loading state while fetching employees", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        });

        renderWithProviders(<AdminEmployeesPage />);

        expect(screen.getByText("Loading employees...")).toBeInTheDocument();
    });

    it("shows error state when fetch fails", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        });

        renderWithProviders(<AdminEmployeesPage />);

        expect(screen.getByText("Unable to load employees.")).toBeInTheDocument();
        expect(screen.getByText("Check your connection or token, then retry.")).toBeInTheDocument();
    });

    it("shows empty state when no employees found", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeesPage />);

        expect(screen.getByText("No employees found")).toBeInTheDocument();
    });

    it("renders table headers", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeesPage />);

        expect(screen.getByText("Code")).toBeInTheDocument();
        // "Name" appears multiple times, so we check for the table content
        expect(screen.getByText("Department")).toBeInTheDocument();
        expect(screen.getByText("Designation")).toBeInTheDocument();
        expect(screen.getByText("Manager")).toBeInTheDocument();
        expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("renders all employees in the table", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeesPage />);

        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
    });

    it("renders employee codes", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeesPage />);

        expect(screen.getByText("EMP001")).toBeInTheDocument();
        expect(screen.getByText("EMP002")).toBeInTheDocument();
        // Bob has no code, shows dash
        const dashes = screen.getAllByText("—");
        expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it("renders employee emails", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeesPage />);

        expect(screen.getByText("john@example.com")).toBeInTheDocument();
        expect(screen.getByText("jane@example.com")).toBeInTheDocument();
        expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    });

    it("renders status badges", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeesPage />);

        expect(screen.getByText("Active")).toBeInTheDocument();
        expect(screen.getByText("On Leave")).toBeInTheDocument();
        expect(screen.getByText("Inactive")).toBeInTheDocument();
    });

    it("renders view buttons for each employee", () => {
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeesPage />);

        const viewButtons = screen.getAllByRole("link", { name: /view/i });
        expect(viewButtons).toHaveLength(3);
        expect(viewButtons[0]).toHaveAttribute("href", "/dashboard/admin/employees/emp-1");
        expect(viewButtons[1]).toHaveAttribute("href", "/dashboard/admin/employees/emp-2");
        expect(viewButtons[2]).toHaveAttribute("href", "/dashboard/admin/employees/emp-3");
    });

    it("updates search input value", async () => {
        const user = userEvent.setup();
        (employeeQueries.useEmployees as jest.Mock).mockReturnValue({
            data: mockEmployees,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeesPage />);

        const searchInput = screen.getByPlaceholderText(/Search by code, name, phone, email/i);
        await user.type(searchInput, "John");

        expect(searchInput).toHaveValue("John");
    });
});
