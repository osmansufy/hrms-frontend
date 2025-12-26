
import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/admin/page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
    useRouter: jest.fn(() => ({ replace: jest.fn() })),
}));


// Mock useSession
jest.mock("@/components/auth/session-provider", () => {
    return {
        __esModule: true,
        ...jest.requireActual("@/components/auth/session-provider"),
        useSession: jest.fn(),
    };
});

describe("Admin Dashboard Access Control", () => {


    afterEach(() => {
        jest.clearAllMocks();
    });


    it("allows access for admin role", () => {
        const { useSession } = require("@/components/auth/session-provider");
        useSession.mockImplementation(() => ({
            session: {
                user: {
                    id: "test-user",
                    email: "test@company.com",
                    roles: ["admin"],
                    permissions: [],
                },
                token: "test-token",
            },
            status: "authenticated",
            signIn: jest.fn(),
            signUp: jest.fn(),
            signOut: jest.fn(),
        }));
        render(<DashboardPage />);
        expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
    });


    it("denies access for employee role", () => {
        const { useSession } = require("@/components/auth/session-provider");
        useSession.mockImplementation(() => ({
            session: {
                user: {
                    id: "test-user",
                    email: "test@company.com",
                    roles: ["employee"],
                    permissions: [],
                },
                token: "test-token",
            },
            status: "authenticated",
            signIn: jest.fn(),
            signUp: jest.fn(),
            signOut: jest.fn(),
        }));
        render(<DashboardPage />);
        expect(screen.queryByText(/Admin Dashboard/i)).not.toBeInTheDocument();
        expect(screen.getByText(/403 - Access Denied/i)).toBeInTheDocument();
        // Optionally, check for redirect or 403 message
    });


    it("allows access for super-admin role", () => {
        const { useSession } = require("@/components/auth/session-provider");
        useSession.mockImplementation(() => ({
            session: {
                user: {
                    id: "test-user",
                    email: "test@company.com",
                    roles: ["super-admin"],
                    permissions: [],
                },
                token: "test-token",
            },
            status: "authenticated",
            signIn: jest.fn(),
            signUp: jest.fn(),
            signOut: jest.fn(),
        }));
        render(<DashboardPage />);
        expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
    });
});


