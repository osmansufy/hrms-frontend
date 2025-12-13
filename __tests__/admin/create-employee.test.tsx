import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import CreateEmployeePage from "@/app/dashboard/admin/employees/create/page";
import * as employeeQueries from "@/lib/queries/employees";

// Mock next/navigation
jest.mock("next/navigation", () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
    })),
}));

// Mock employee queries
jest.mock("@/lib/queries/employees", () => ({
    useCreateEmployee: jest.fn(),
    useDepartments: jest.fn(),
    useDesignations: jest.fn(),
    useManagers: jest.fn(),
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

const mockDepartments = [
    { id: "dept-1", name: "Engineering" },
    { id: "dept-2", name: "HR" },
];

const mockDesignations = [
    { id: "des-1", title: "Software Engineer" },
    { id: "des-2", title: "HR Manager" },
];

const mockManagers = [
    { id: "emp-1", firstName: "John", lastName: "Doe" },
    { id: "emp-2", firstName: "Jane", lastName: "Smith" },
];

describe("CreateEmployeePage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (employeeQueries.useCreateEmployee as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isPending: false,
        });
        (employeeQueries.useDepartments as jest.Mock).mockReturnValue({
            data: mockDepartments,
            isLoading: false,
        });
        (employeeQueries.useDesignations as jest.Mock).mockReturnValue({
            data: mockDesignations,
            isLoading: false,
        });
        (employeeQueries.useManagers as jest.Mock).mockReturnValue({
            data: mockManagers,
            isFetching: false,
        });
    });

    it("renders the page header", () => {
        renderWithProviders(<CreateEmployeePage />);

        expect(screen.getByText("Admin · Employees")).toBeInTheDocument();
        // "Create employee" appears in both header and submit button, use getAllByText
        const createElements = screen.getAllByText("Create employee");
        expect(createElements.length).toBeGreaterThanOrEqual(1);
    });

    it("renders back button", () => {
        renderWithProviders(<CreateEmployeePage />);

        expect(screen.getByRole("link", { name: /back/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute(
            "href",
            "/dashboard/admin/employees"
        );
    });

    it("renders new employee card", () => {
        renderWithProviders(<CreateEmployeePage />);

        expect(screen.getByText("New employee")).toBeInTheDocument();
    });

    it("renders email input", () => {
        renderWithProviders(<CreateEmployeePage />);

        expect(screen.getByText("Email *")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("john.doe@company.com")).toBeInTheDocument();
    });

    it("renders password input", () => {
        renderWithProviders(<CreateEmployeePage />);

        expect(screen.getByText("Password *")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Min 6 characters")).toBeInTheDocument();
    });

    it("renders first name input", () => {
        renderWithProviders(<CreateEmployeePage />);

        expect(screen.getByText("First name *")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("John")).toBeInTheDocument();
    });

    it("renders last name input", () => {
        renderWithProviders(<CreateEmployeePage />);

        expect(screen.getByText("Last name *")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Doe")).toBeInTheDocument();
    });

    it("renders middle name input", () => {
        renderWithProviders(<CreateEmployeePage />);

        expect(screen.getByText("Middle name")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Optional")).toBeInTheDocument();
    });

    it("renders date of birth input", () => {
        renderWithProviders(<CreateEmployeePage />);

        expect(screen.getByText("Date of birth *")).toBeInTheDocument();
    });

    it("renders phone input", () => {
        renderWithProviders(<CreateEmployeePage />);

        expect(screen.getByText("Phone *")).toBeInTheDocument();
    });

    it("renders gender select", () => {
        renderWithProviders(<CreateEmployeePage />);

        expect(screen.getByText("Gender *")).toBeInTheDocument();
    });

    it("renders employment type select", () => {
        renderWithProviders(<CreateEmployeePage />);

        expect(screen.getByText("Employment type *")).toBeInTheDocument();
    });

    it("renders joining date input", () => {
        renderWithProviders(<CreateEmployeePage />);

        expect(screen.getByText("Joining date *")).toBeInTheDocument();
    });

    it("renders submit button", () => {
        renderWithProviders(<CreateEmployeePage />);

        expect(screen.getByRole("button", { name: /create employee/i })).toBeInTheDocument();
    });

    it("shows validation errors when form is submitted empty", async () => {
        const user = userEvent.setup();
        renderWithProviders(<CreateEmployeePage />);

        const submitButton = screen.getByRole("button", { name: /create employee/i });
        await user.click(submitButton);

        await waitFor(() => {
            // Multiple validation errors appear, use getAllByText
            const errorElements = screen.getAllByText(/invalid/i);
            expect(errorElements.length).toBeGreaterThan(0);
        });
    });

    it("can fill in email field", async () => {
        const user = userEvent.setup();
        renderWithProviders(<CreateEmployeePage />);

        const emailInput = screen.getByPlaceholderText("john.doe@company.com");
        await user.type(emailInput, "test@example.com");

        expect(emailInput).toHaveValue("test@example.com");
    });

    it("can fill in first name field", async () => {
        const user = userEvent.setup();
        renderWithProviders(<CreateEmployeePage />);

        const firstNameInput = screen.getByPlaceholderText("John");
        await user.type(firstNameInput, "Test");

        expect(firstNameInput).toHaveValue("Test");
    });

    it("disables submit button while creating", () => {
        (employeeQueries.useCreateEmployee as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isPending: true,
        });

        renderWithProviders(<CreateEmployeePage />);

        const submitButton = screen.getByRole("button", { name: /creating/i });
        expect(submitButton).toBeDisabled();
    });
});
