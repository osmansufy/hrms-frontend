import { render, screen } from "@testing-library/react";

import ProfilePage from "@/app/dashboard/employee/profile/page";
import * as sessionProvider from "@/components/auth/session-provider";

// Mock session provider
jest.mock("@/components/auth/session-provider", () => ({
    useSession: jest.fn(),
}));

describe("ProfilePage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the profile page header", () => {
        (sessionProvider.useSession as jest.Mock).mockReturnValue({
            session: null,
        });

        render(<ProfilePage />);

        // "Account" appears twice (header and card title), use getAllByText
        const accountElements = screen.getAllByText("Account");
        expect(accountElements.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Your profile")).toBeInTheDocument();
    });

    it("renders profile card", () => {
        (sessionProvider.useSession as jest.Mock).mockReturnValue({
            session: null,
        });

        render(<ProfilePage />);

        expect(screen.getByText("Mock data sourced from the local session.")).toBeInTheDocument();
    });

    it("displays N/A when no session data", () => {
        (sessionProvider.useSession as jest.Mock).mockReturnValue({
            session: null,
        });

        render(<ProfilePage />);

        const naElements = screen.getAllByText("N/A");
        expect(naElements.length).toBeGreaterThanOrEqual(3);
    });

    it("displays user name from session", () => {
        (sessionProvider.useSession as jest.Mock).mockReturnValue({
            session: {
                user: {
                    name: "John Doe",
                    email: "john@example.com",
                    roles: ["employee"],
                },
                token: "test-token",
            },
        });

        render(<ProfilePage />);

        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("displays user email from session", () => {
        (sessionProvider.useSession as jest.Mock).mockReturnValue({
            session: {
                user: {
                    name: "John Doe",
                    email: "john@example.com",
                    roles: ["employee"],
                },
                token: "test-token",
            },
        });

        render(<ProfilePage />);

        expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("displays user role from session", () => {
        (sessionProvider.useSession as jest.Mock).mockReturnValue({
            session: {
                user: {
                    name: "John Doe",
                    email: "john@example.com",
                    roles: ["employee", "manager"],
                },
                token: "test-token",
            },
        });

        render(<ProfilePage />);

        expect(screen.getByText("employee, manager")).toBeInTheDocument();
    });

    it("displays single role correctly", () => {
        (sessionProvider.useSession as jest.Mock).mockReturnValue({
            session: {
                user: {
                    name: "John Doe",
                    email: "john@example.com",
                    roles: ["admin"],
                },
                token: "test-token",
            },
        });

        render(<ProfilePage />);

        expect(screen.getByText("admin")).toBeInTheDocument();
    });

    it("renders profile row labels", () => {
        (sessionProvider.useSession as jest.Mock).mockReturnValue({
            session: {
                user: {
                    name: "John Doe",
                    email: "john@example.com",
                    roles: ["employee"],
                },
                token: "test-token",
            },
        });

        render(<ProfilePage />);

        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Email")).toBeInTheDocument();
        expect(screen.getByText("Role")).toBeInTheDocument();
    });

    it("displays authentication status", () => {
        (sessionProvider.useSession as jest.Mock).mockReturnValue({
            session: {
                user: {
                    name: "John Doe",
                    email: "john@example.com",
                    roles: ["employee"],
                },
                token: "test-token",
            },
        });

        render(<ProfilePage />);

        expect(screen.getByText("Status")).toBeInTheDocument();
        expect(screen.getByText("Authenticated (mock)")).toBeInTheDocument();
        expect(screen.getByText("Local session")).toBeInTheDocument();
    });
});
