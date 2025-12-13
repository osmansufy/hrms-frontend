import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import SettingsPage from "@/app/dashboard/admin/settings/page";

// Mock sonner toast
jest.mock("sonner", () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock ResizeObserver for Radix Switch component
class ResizeObserverMock {
    observe() { }
    unobserve() { }
    disconnect() { }
}
global.ResizeObserver = ResizeObserverMock;

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

describe("SettingsPage", () => {
    it("renders the page header", () => {
        renderWithProviders(<SettingsPage />);

        expect(screen.getByText("Workspace")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("renders mock only badge", () => {
        renderWithProviders(<SettingsPage />);

        expect(screen.getByText("Mock only")).toBeInTheDocument();
    });

    it("renders profile card", () => {
        renderWithProviders(<SettingsPage />);

        expect(screen.getByText("Profile")).toBeInTheDocument();
        expect(screen.getByText("Basic details used across the app.")).toBeInTheDocument();
    });

    it("renders notifications card", () => {
        renderWithProviders(<SettingsPage />);

        expect(screen.getByText("Notifications")).toBeInTheDocument();
        expect(screen.getByText("Control alerts and approvals.")).toBeInTheDocument();
    });

    it("renders name input with default value", () => {
        renderWithProviders(<SettingsPage />);

        const nameInput = screen.getByDisplayValue("HR Manager");
        expect(nameInput).toBeInTheDocument();
    });

    it("renders role input with default value", () => {
        renderWithProviders(<SettingsPage />);

        const roleInput = screen.getByDisplayValue("People Operations");
        expect(roleInput).toBeInTheDocument();
    });

    it("renders email input with default value", () => {
        renderWithProviders(<SettingsPage />);

        const emailInput = screen.getByDisplayValue("hr@acme.com");
        expect(emailInput).toBeInTheDocument();
    });

    it("renders notification toggles", () => {
        renderWithProviders(<SettingsPage />);

        expect(screen.getByText("Approval requests")).toBeInTheDocument();
        expect(screen.getByText("Alerts")).toBeInTheDocument();
        expect(screen.getByText("Weekly digest")).toBeInTheDocument();
    });

    it("renders notification descriptions", () => {
        renderWithProviders(<SettingsPage />);

        expect(screen.getByText(/Time off, attendance, and onboarding approvals/)).toBeInTheDocument();
        expect(screen.getByText(/High-priority alerts for compliance and payroll/)).toBeInTheDocument();
        expect(screen.getByText(/Summary of changes and upcoming anniversaries/)).toBeInTheDocument();
    });

    it("renders save button", () => {
        renderWithProviders(<SettingsPage />);

        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });

    it("can update name field", async () => {
        const user = userEvent.setup();
        renderWithProviders(<SettingsPage />);

        const nameInput = screen.getByDisplayValue("HR Manager");
        await user.clear(nameInput);
        await user.type(nameInput, "New Name");

        expect(nameInput).toHaveValue("New Name");
    });

    it("can update email field", async () => {
        const user = userEvent.setup();
        renderWithProviders(<SettingsPage />);

        const emailInput = screen.getByDisplayValue("hr@acme.com");
        await user.clear(emailInput);
        await user.type(emailInput, "new@example.com");

        expect(emailInput).toHaveValue("new@example.com");
    });

    it("can submit form with valid data", async () => {
        const user = userEvent.setup();
        const { toast } = await import("sonner");

        renderWithProviders(<SettingsPage />);

        const saveButton = screen.getByRole("button", { name: /save/i });
        await user.click(saveButton);

        // Check toast was called (form submitted successfully with default values)
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Settings saved (mock)");
        });
    });

    it("renders notification switches", () => {
        renderWithProviders(<SettingsPage />);

        const switches = screen.getAllByRole("switch");
        expect(switches.length).toBe(3);
    });
});
