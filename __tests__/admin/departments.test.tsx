import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import DepartmentsPage from "@/app/dashboard/admin/departments/page";
import * as departmentQueries from "@/lib/queries/departments";

// Mock department queries
jest.mock("@/lib/queries/departments", () => ({
    useDepartments: jest.fn(),
    useCreateDepartment: jest.fn(),
    useUpdateDepartment: jest.fn(),
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
    { id: "dept-1", name: "Engineering", code: "ENG" },
    { id: "dept-2", name: "Human Resources", code: "HR" },
    { id: "dept-3", name: "Design", code: "DES" },
];

describe("DepartmentsPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (departmentQueries.useCreateDepartment as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isPending: false,
        });
        (departmentQueries.useUpdateDepartment as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
        });
    });

    it("renders the page header", () => {
        (departmentQueries.useDepartments as jest.Mock).mockReturnValue({
            data: mockDepartments,
            isLoading: false,
        });

        renderWithProviders(<DepartmentsPage />);

        expect(screen.getByText("Admin · Organization")).toBeInTheDocument();
        expect(screen.getByText("Departments")).toBeInTheDocument();
    });

    it("renders department list card", () => {
        (departmentQueries.useDepartments as jest.Mock).mockReturnValue({
            data: mockDepartments,
            isLoading: false,
        });

        renderWithProviders(<DepartmentsPage />);

        expect(screen.getByText("Department list")).toBeInTheDocument();
        expect(screen.getByText("Fetched from `/departments`.")).toBeInTheDocument();
    });

    it("renders create department card", () => {
        (departmentQueries.useDepartments as jest.Mock).mockReturnValue({
            data: mockDepartments,
            isLoading: false,
        });

        renderWithProviders(<DepartmentsPage />);

        expect(screen.getByText("Create department")).toBeInTheDocument();
        expect(screen.getByText("Add a department with name and code.")).toBeInTheDocument();
    });

    it("renders table headers", () => {
        (departmentQueries.useDepartments as jest.Mock).mockReturnValue({
            data: mockDepartments,
            isLoading: false,
        });

        renderWithProviders(<DepartmentsPage />);

        // Multiple "Name" elements exist (table header and form label)
        const nameElements = screen.getAllByText("Name");
        expect(nameElements.length).toBeGreaterThanOrEqual(1);

        // Multiple "Code" elements exist
        const codeElements = screen.getAllByText("Code");
        expect(codeElements.length).toBeGreaterThanOrEqual(1);
    });

    it("renders all departments in the table", () => {
        (departmentQueries.useDepartments as jest.Mock).mockReturnValue({
            data: mockDepartments,
            isLoading: false,
        });

        renderWithProviders(<DepartmentsPage />);

        expect(screen.getByText("Engineering")).toBeInTheDocument();
        expect(screen.getByText("Human Resources")).toBeInTheDocument();
        expect(screen.getByText("Design")).toBeInTheDocument();
        expect(screen.getByText("ENG")).toBeInTheDocument();
        expect(screen.getByText("HR")).toBeInTheDocument();
        expect(screen.getByText("DES")).toBeInTheDocument();
    });

    it("shows empty state when no departments", () => {
        (departmentQueries.useDepartments as jest.Mock).mockReturnValue({
            data: [],
            isLoading: false,
        });

        renderWithProviders(<DepartmentsPage />);

        expect(screen.getByText("No departments yet.")).toBeInTheDocument();
    });

    it("renders form inputs", () => {
        (departmentQueries.useDepartments as jest.Mock).mockReturnValue({
            data: mockDepartments,
            isLoading: false,
        });

        renderWithProviders(<DepartmentsPage />);

        expect(screen.getByPlaceholderText("Engineering")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("ENG")).toBeInTheDocument();
    });

    it("renders create button", () => {
        (departmentQueries.useDepartments as jest.Mock).mockReturnValue({
            data: mockDepartments,
            isLoading: false,
        });

        renderWithProviders(<DepartmentsPage />);

        expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
    });

    it("shows validation errors when submitting empty form", async () => {
        const user = userEvent.setup();
        (departmentQueries.useDepartments as jest.Mock).mockReturnValue({
            data: mockDepartments,
            isLoading: false,
        });

        renderWithProviders(<DepartmentsPage />);

        const createButton = screen.getByRole("button", { name: /create/i });
        await user.click(createButton);

        await waitFor(() => {
            expect(screen.getByText("Name is required")).toBeInTheDocument();
        });
    });

    it("calls create mutation with form values", async () => {
        const user = userEvent.setup();
        const mockMutateAsync = jest.fn().mockResolvedValue({});

        (departmentQueries.useDepartments as jest.Mock).mockReturnValue({
            data: mockDepartments,
            isLoading: false,
        });
        (departmentQueries.useCreateDepartment as jest.Mock).mockReturnValue({
            mutateAsync: mockMutateAsync,
            isPending: false,
        });

        renderWithProviders(<DepartmentsPage />);

        const nameInput = screen.getByPlaceholderText("Engineering");
        const codeInput = screen.getByPlaceholderText("ENG");

        await user.type(nameInput, "Marketing");
        await user.type(codeInput, "MKT");

        const createButton = screen.getByRole("button", { name: /create/i });
        await user.click(createButton);

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledWith({
                name: "Marketing",
                code: "MKT",
            });
        });
    });

    it("shows creating state while mutation is pending", () => {
        (departmentQueries.useDepartments as jest.Mock).mockReturnValue({
            data: mockDepartments,
            isLoading: false,
        });
        (departmentQueries.useCreateDepartment as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isPending: true,
        });

        renderWithProviders(<DepartmentsPage />);

        expect(screen.getByRole("button", { name: /creating/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
    });
});
