import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AdminEmployeeDetailPage from "@/app/dashboard/admin/employees/[id]/page";
import * as employeeQueries from "@/lib/queries/employees";

// Mock next/navigation
jest.mock("next/navigation", () => ({
    useParams: jest.fn(),
    useRouter: jest.fn(() => ({
        push: jest.fn(),
    })),
}));

// Mock employee queries
jest.mock("@/lib/queries/employees", () => ({
    useEmployeeDetail: jest.fn(),
    useUpdateEmployee: jest.fn(),
    useDeleteEmployee: jest.fn(),
    useManagers: jest.fn(),
    useAssignManager: jest.fn(),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
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
    employeeCode: "EMP001",
    firstName: "John",
    middleName: null,
    lastName: "Doe",
    phone: "+1 555-0123",
    employmentType: "FULL_TIME",
    joiningDate: "2024-01-15T00:00:00Z",
    departmentId: "dept-1",
    designationId: "des-1",
    reportingManagerId: "emp-2",
    department: { name: "Engineering" },
    designation: { title: "Software Engineer" },
    reportingManager: { firstName: "Jane", lastName: "Smith" },
    user: {
        email: "john@example.com",
        status: "ACTIVE",
    },
};

describe("AdminEmployeeDetailPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useParams as jest.Mock).mockReturnValue({ id: "emp-1" });
        (employeeQueries.useUpdateEmployee as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
        });
        (employeeQueries.useDeleteEmployee as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
        });
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

    it("shows loading state while fetching employee", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByText("Loading employee...")).toBeInTheDocument();
    });

    it("shows not found state when employee does not exist", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByText("Employee not found")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /back to employees/i })).toBeInTheDocument();
    });

    it("shows not found state on error", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
            isError: true,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByText("Employee not found")).toBeInTheDocument();
    });

    it("renders employee name as heading", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders back button", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByRole("link", { name: /back/i })).toBeInTheDocument();
    });

    it("renders employee code badge", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByText("EMP001")).toBeInTheDocument();
    });

    it("renders status badge", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("renders profile card", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByText("Profile")).toBeInTheDocument();
        expect(screen.getByText("Core employee and user details.")).toBeInTheDocument();
    });

    it("renders employee email", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("renders employee phone", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByText("+1 555-0123")).toBeInTheDocument();
    });

    it("renders department name", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByText("Engineering")).toBeInTheDocument();
    });

    it("renders designation title", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    });

    it("renders employment type", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        // "Full Time" appears multiple times (display + select), use getAllByText
        const fullTimeElements = screen.getAllByText("Full Time");
        expect(fullTimeElements.length).toBeGreaterThan(0);
    });

    it("renders manager name", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("handles array id parameter", () => {
        (useParams as jest.Mock).mockReturnValue({ id: ["emp-1", "extra"] });
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: mockEmployee,
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("shows 'No code' when employee code is missing", () => {
        (employeeQueries.useEmployeeDetail as jest.Mock).mockReturnValue({
            data: { ...mockEmployee, employeeCode: null },
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<AdminEmployeeDetailPage />);

        expect(screen.getByText("No code")).toBeInTheDocument();
    });
});
