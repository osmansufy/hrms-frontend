import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import EmployeeDetailPage from "@/app/dashboard/employee/directory/[id]/page";
import * as employeeQueries from "@/lib/queries/employees";

// Mock next/navigation
jest.mock("next/navigation", () => ({
    useParams: jest.fn(),
}));

// Mock employee query
jest.mock("@/lib/queries/employees", () => ({
    useEmployee: jest.fn(),
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

const mockEmployee = {
    id: "emp-1",
    name: "John Doe",
    title: "Software Engineer",
    department: "Engineering",
    email: "john@example.com",
    manager: "Jane Smith",
    startDate: "2024-01-15",
    phone: "+1 555-0123",
    location: "Remote",
    status: "Active",
};

describe("EmployeeDetailPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useParams as jest.Mock).mockReturnValue({ id: "emp-1" });
    });

    it("shows loading state while fetching employee", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: true,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("Loading profile...")).toBeInTheDocument();
    });

    it("shows not found state when employee does not exist", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("Employee not found")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /back to directory/i })).toBeInTheDocument();
    });

    it("renders employee name as heading", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders back button", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByRole("link", { name: /back/i })).toBeInTheDocument();
    });

    it("renders profile card with title and description", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("Profile")).toBeInTheDocument();
        expect(screen.getByText("Summary of employee information.")).toBeInTheDocument();
    });

    it("renders employee title", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("Title")).toBeInTheDocument();
        expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    });

    it("renders employee department", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("Department")).toBeInTheDocument();
        expect(screen.getByText("Engineering")).toBeInTheDocument();
    });

    it("renders employee email", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("Email")).toBeInTheDocument();
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("renders employee manager", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("Manager")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("renders employee start date", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("Start date")).toBeInTheDocument();
        expect(screen.getByText("2024-01-15")).toBeInTheDocument();
    });

    it("renders employee phone", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("Phone")).toBeInTheDocument();
        expect(screen.getByText("+1 555-0123")).toBeInTheDocument();
    });

    it("renders employee status badge", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("renders summary card", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("Summary")).toBeInTheDocument();
        expect(screen.getByText("Read-only employee snapshot.")).toBeInTheDocument();
    });

    it("shows dash for missing manager", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: { ...mockEmployee, manager: undefined },
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("shows dash for missing phone", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: { ...mockEmployee, phone: undefined },
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        // There should be dashes for missing optional fields
        const dashes = screen.getAllByText("—");
        expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it("renders On Leave status with correct variant", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: { ...mockEmployee, status: "On Leave" },
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("On Leave")).toBeInTheDocument();
    });

    it("renders Inactive status with correct variant", () => {
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: { ...mockEmployee, status: "Inactive" },
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("Inactive")).toBeInTheDocument();
    });

    it("handles array id parameter", () => {
        (useParams as jest.Mock).mockReturnValue({ id: ["emp-1", "extra"] });
        (employeeQueries.useEmployee as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
        });

        renderWithProviders(<EmployeeDetailPage />);

        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
});
