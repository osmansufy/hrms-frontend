import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import DesignationsPage from "@/app/dashboard/admin/designations/page";
import * as designationQueries from "@/lib/queries/designations";

// Mock designation queries
jest.mock("@/lib/queries/designations", () => ({
    useDesignationsList: jest.fn(),
    useCreateDesignation: jest.fn(),
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

const mockDesignations = [
    { id: "des-1", title: "Software Engineer", code: "SE" },
    { id: "des-2", title: "Product Manager", code: "PM" },
    { id: "des-3", name: "Designer", code: "DES" }, // Using name instead of title
];

describe("DesignationsPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (designationQueries.useCreateDesignation as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isPending: false,
        });
    });

    it("renders the page header", () => {
        (designationQueries.useDesignationsList as jest.Mock).mockReturnValue({
            data: mockDesignations,
            isLoading: false,
        });

        renderWithProviders(<DesignationsPage />);

        expect(screen.getByText("Admin · Organization")).toBeInTheDocument();
        expect(screen.getByText("Designations")).toBeInTheDocument();
    });

    it("renders designation list card", () => {
        (designationQueries.useDesignationsList as jest.Mock).mockReturnValue({
            data: mockDesignations,
            isLoading: false,
        });

        renderWithProviders(<DesignationsPage />);

        expect(screen.getByText("Designation list")).toBeInTheDocument();
        expect(screen.getByText("Fetched from `/designations`.")).toBeInTheDocument();
    });

    it("renders create designation card", () => {
        (designationQueries.useDesignationsList as jest.Mock).mockReturnValue({
            data: mockDesignations,
            isLoading: false,
        });

        renderWithProviders(<DesignationsPage />);

        expect(screen.getByText("Create designation")).toBeInTheDocument();
        expect(screen.getByText("Add a designation with title and code.")).toBeInTheDocument();
    });

    it("renders table headers", () => {
        (designationQueries.useDesignationsList as jest.Mock).mockReturnValue({
            data: mockDesignations,
            isLoading: false,
        });

        renderWithProviders(<DesignationsPage />);

        // Multiple "Title" elements exist (table header and form label)
        const titleElements = screen.getAllByText("Title");
        expect(titleElements.length).toBeGreaterThanOrEqual(1);

        // Multiple "Code" elements exist
        const codeElements = screen.getAllByText("Code");
        expect(codeElements.length).toBeGreaterThanOrEqual(1);
    });

    it("renders all designations in the table", () => {
        (designationQueries.useDesignationsList as jest.Mock).mockReturnValue({
            data: mockDesignations,
            isLoading: false,
        });

        renderWithProviders(<DesignationsPage />);

        expect(screen.getByText("Software Engineer")).toBeInTheDocument();
        expect(screen.getByText("Product Manager")).toBeInTheDocument();
        expect(screen.getByText("Designer")).toBeInTheDocument();
        expect(screen.getByText("SE")).toBeInTheDocument();
        expect(screen.getByText("PM")).toBeInTheDocument();
        expect(screen.getByText("DES")).toBeInTheDocument();
    });

    it("shows empty state when no designations", () => {
        (designationQueries.useDesignationsList as jest.Mock).mockReturnValue({
            data: [],
            isLoading: false,
        });

        renderWithProviders(<DesignationsPage />);

        expect(screen.getByText("No designations yet.")).toBeInTheDocument();
    });

    it("renders form inputs", () => {
        (designationQueries.useDesignationsList as jest.Mock).mockReturnValue({
            data: mockDesignations,
            isLoading: false,
        });

        renderWithProviders(<DesignationsPage />);

        expect(screen.getByPlaceholderText("Software Engineer")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("SE")).toBeInTheDocument();
    });

    it("renders create button", () => {
        (designationQueries.useDesignationsList as jest.Mock).mockReturnValue({
            data: mockDesignations,
            isLoading: false,
        });

        renderWithProviders(<DesignationsPage />);

        expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
    });

    it("shows validation errors when submitting empty form", async () => {
        const user = userEvent.setup();
        (designationQueries.useDesignationsList as jest.Mock).mockReturnValue({
            data: mockDesignations,
            isLoading: false,
        });

        renderWithProviders(<DesignationsPage />);

        const createButton = screen.getByRole("button", { name: /create/i });
        await user.click(createButton);

        await waitFor(() => {
            expect(screen.getByText("Title is required")).toBeInTheDocument();
        });
    });

    it("calls create mutation with form values", async () => {
        const user = userEvent.setup();
        const mockMutateAsync = jest.fn().mockResolvedValue({});

        (designationQueries.useDesignationsList as jest.Mock).mockReturnValue({
            data: mockDesignations,
            isLoading: false,
        });
        (designationQueries.useCreateDesignation as jest.Mock).mockReturnValue({
            mutateAsync: mockMutateAsync,
            isPending: false,
        });

        renderWithProviders(<DesignationsPage />);

        const titleInput = screen.getByPlaceholderText("Software Engineer");
        const codeInput = screen.getByPlaceholderText("SE");

        await user.type(titleInput, "Tech Lead");
        await user.type(codeInput, "TL");

        const createButton = screen.getByRole("button", { name: /create/i });
        await user.click(createButton);

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledWith({
                title: "Tech Lead",
                code: "TL",
            });
        });
    });

    it("shows creating state while mutation is pending", () => {
        (designationQueries.useDesignationsList as jest.Mock).mockReturnValue({
            data: mockDesignations,
            isLoading: false,
        });
        (designationQueries.useCreateDesignation as jest.Mock).mockReturnValue({
            mutateAsync: jest.fn(),
            isPending: true,
        });

        renderWithProviders(<DesignationsPage />);

        expect(screen.getByRole("button", { name: /creating/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
    });
});
