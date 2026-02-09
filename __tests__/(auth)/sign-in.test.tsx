import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";

import { SignInView } from "@/app/(auth)/sign-in/sign-in-view";
import * as sessionProvider from "@/components/auth/session-provider";

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
  })),
}));

// Mock session provider
jest.mock("@/components/auth/session-provider", () => ({
  useSession: jest.fn(),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock token verification
jest.mock("@/lib/auth/token", () => ({
  verifyToken: jest.fn((token: string) =>
    Promise.resolve({
      valid: true,
      payload: {
        sub: "user-1",
        email: "user@example.com",
        name: "Test User",
        roles: ["employee"],
      },
    })
  ),
}));

describe("SignInView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    (sessionProvider.useSession as jest.Mock).mockReturnValue({
      signIn: jest.fn(),
      status: "unauthenticated",
      session: null,
    });
  });

  describe("Initial Render", () => {
    it("renders the sign-in form", () => {
      render(<SignInView />);

      expect(screen.getByText(/sign in as/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("renders with default member role when no roleParam provided", () => {
      render(<SignInView />);

      expect(screen.getByText(/sign in as member/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Access your member workspace/i)
      ).toBeInTheDocument();
    });

    it("renders with member role when roleParam is 'member'", () => {
      render(<SignInView roleParam="member" />);

      expect(screen.getByText(/sign in as member/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Access your member workspace/i)
      ).toBeInTheDocument();
    });

    it("renders with admin role when roleParam is 'admin'", () => {
      render(<SignInView roleParam="admin" />);

      expect(screen.getByText(/sign in as admin/i)).toBeInTheDocument();
      expect(screen.getByText(/Access the Admin console/i)).toBeInTheDocument();
    });

    it("renders with super-admin role when roleParam is 'super-admin'", () => {
      render(<SignInView roleParam="super-admin" />);

      expect(screen.getByText(/sign in as super admin/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Access the Super Admin console/i)
      ).toBeInTheDocument();
    });

    it("renders email input with correct placeholder", () => {
      render(<SignInView />);

      const emailInput = screen.getByPlaceholderText("you@company.com");
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("renders password input with correct placeholder", () => {
      render(<SignInView />);

      const passwordInput = screen.getByPlaceholderText("••••••••");
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("renders forgot password link", () => {
      render(<SignInView />);

      const forgotPasswordLink = screen.getByRole("link", { name: /forgot password/i });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
    });

    it("renders console selection links", () => {
      render(<SignInView />);

      expect(screen.getByRole("link", { name: /member/i })).toBeInTheDocument();
      // Use getAllByRole and filter by href to avoid matching "Super Admin" when searching for "Admin"
      const adminLinks = screen.getAllByRole("link");
      const adminLink = adminLinks.find((link) => link.getAttribute("href") === "/sign-in/admin");
      expect(adminLink).toBeInTheDocument();
      const superAdminLink = adminLinks.find(
        (link) => link.getAttribute("href") === "/sign-in/super-admin"
      );
      expect(superAdminLink).toBeInTheDocument();
    });

    it("renders console selection links with correct hrefs", () => {
      render(<SignInView />);

      expect(screen.getByRole("link", { name: /member/i })).toHaveAttribute(
        "href",
        "/sign-in/member"
      );
      const adminLinks = screen.getAllByRole("link");
      const adminLink = adminLinks.find((link) => link.getAttribute("href") === "/sign-in/admin");
      expect(adminLink).toBeInTheDocument();
      const superAdminLink = adminLinks.find(
        (link) => link.getAttribute("href") === "/sign-in/super-admin"
      );
      expect(superAdminLink).toBeInTheDocument();
    });
  });

  describe("Password Visibility Toggle", () => {
    it("toggles password visibility when eye icon is clicked", async () => {
      const user = userEvent.setup();
      render(<SignInView />);

      const passwordInput = screen.getByPlaceholderText("••••••••") as HTMLInputElement;
      expect(passwordInput).toHaveAttribute("type", "password");

      // Find the toggle button (eye icon)
      const toggleButton = passwordInput.parentElement?.querySelector('button[type="button"]');
      expect(toggleButton).toBeInTheDocument();

      await user.click(toggleButton!);

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute("type", "text");
      });

      await user.click(toggleButton!);

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute("type", "password");
      });
    });
  });

  describe("Form Validation", () => {
    it("shows validation error for invalid email format", async () => {
      const user = userEvent.setup();
      render(<SignInView />);

      const emailInput = screen.getByLabelText(/email/i);
      const form = emailInput.closest("form");

      await user.type(emailInput, "invalid-email");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        const errorMessage = document.querySelector('[data-slot="form-message"]');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage?.textContent).toMatch(/valid email/i);
      });
    });

    it("shows validation error for empty email", async () => {
      const user = userEvent.setup();
      render(<SignInView />);

      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = passwordInput.closest("form");

      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        const errorMessages = document.querySelectorAll('[data-slot="form-message"]');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it("shows validation error for password less than 6 characters", async () => {
      const user = userEvent.setup();
      render(<SignInView />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "12345");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        const errorMessages = document.querySelectorAll('[data-slot="form-message"]');
        // Check if any error message exists (validation should prevent submission)
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it("does not submit form with invalid email", async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn();
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView />);

      const emailInput = screen.getByLabelText(/email/i);
      const form = emailInput.closest("form");

      await user.type(emailInput, "invalid-email");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockSignIn).not.toHaveBeenCalled();
      });
    });
  });

  describe("Successful Login", () => {
    it("submits form with valid credentials", async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn().mockResolvedValue(["employee"]);
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: "user@example.com",
          password: "password123",
        });
      });
    });

    it("shows success message after successful login", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockSignIn = jest.fn().mockResolvedValue(["employee"]);
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Welcome back");
      });
    });

    it("redirects to role home after successful login", async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn().mockResolvedValue(["employee"]);
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView roleParam="member" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard/employee");
      });
    });

    it("redirects to callbackUrl if provided", async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn().mockResolvedValue(["employee"]);
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView callbackUrl="/custom-path" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/custom-path");
      });
    });

    it("redirects admin to admin dashboard", async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn().mockResolvedValue(["admin"]);
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView roleParam="admin" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "admin@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard/admin");
      });
    });

    it("redirects super-admin to super-admin dashboard", async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn().mockResolvedValue(["super-admin"]);
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView roleParam="super-admin" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "superadmin@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard/super-admin");
      });
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(["employee"]), 100);
          })
      );
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      // Check loading state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /signing in/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
      });

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /signing in/i })).not.toBeInTheDocument();
      });
    });
  });

  describe("Admin Authorization Check", () => {
    it("shows error when non-admin tries to access admin portal", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockSignIn = jest.fn().mockResolvedValue(["employee"]);
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView roleParam="admin" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "employee@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "You are not authorized to access the Admin Portal."
        );
      });
    });

    it("shows error when non-admin tries to access super-admin portal", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockSignIn = jest.fn().mockResolvedValue(["employee"]);
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView roleParam="super-admin" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "employee@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "You are not authorized to access the Admin Portal."
        );
      });
    });

    it("allows admin to access admin portal", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockSignIn = jest.fn().mockResolvedValue(["admin"]);
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView roleParam="admin" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "admin@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(toast.error).not.toHaveBeenCalledWith(
          "You are not authorized to access the Admin Portal."
        );
        expect(toast.success).toHaveBeenCalledWith("Welcome back");
      });
    });
  });

  describe("Error Handling", () => {
    it("displays error message when login fails", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockSignIn = jest.fn().mockRejectedValue(new Error("Invalid credentials"));
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "wrongpassword");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
      });

      // Form should still be visible (not redirected)
      expect(screen.getByText(/sign in as/i)).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("displays generic error message for 'No session found' error", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockSignIn = jest.fn().mockRejectedValue(new Error("No session found"));
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Invalid email or password. Please try again."
        );
      });
    });

    it("displays generic error message for 'No refresh token available' error", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockSignIn = jest.fn().mockRejectedValue(
        new Error("No refresh token available")
      );
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Invalid email or password. Please try again."
        );
      });
    });

    it("displays error message from Axios error response", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      // The signIn function extracts the error message from Axios error, so mock it to throw the extracted message
      const mockSignIn = jest.fn().mockRejectedValue(new Error("Account locked"));
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Account locked");
      });
    });
  });

  describe("Auto-redirect on Authentication", () => {
    it("redirects when status becomes authenticated", async () => {
      const mockSignIn = jest.fn().mockResolvedValue(["employee"]);
      const { useSession } = require("@/components/auth/session-provider");

      // Start with unauthenticated
      (useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      const { rerender } = render(<SignInView roleParam="member" />);

      // Simulate authentication status change
      (useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "authenticated",
        session: {
          user: {
            id: "user-1",
            email: "user@example.com",
            roles: ["employee"],
          },
        },
      });

      rerender(<SignInView roleParam="member" />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/dashboard/employee");
      });
    });

    it("uses callbackUrl for redirect when authenticated", async () => {
      const mockSignIn = jest.fn().mockResolvedValue(["employee"]);
      const { useSession } = require("@/components/auth/session-provider");

      (useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "authenticated",
        session: {
          user: {
            id: "user-1",
            email: "user@example.com",
            roles: ["employee"],
          },
        },
      });

      render(<SignInView roleParam="member" callbackUrl="/custom-path" />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/custom-path");
      });
    });
  });

  describe("Role Priority", () => {
    it("redirects to super-admin dashboard when user has multiple roles", async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn().mockResolvedValue(["super-admin", "admin", "employee"]);
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard/super-admin");
      });
    });

    it("redirects to admin dashboard when user has admin role (not super-admin)", async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn().mockResolvedValue(["admin", "employee"]);
      (sessionProvider.useSession as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        status: "unauthenticated",
        session: null,
      });

      render(<SignInView />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const form = emailInput.closest("form");

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard/admin");
      });
    });
  });
});
