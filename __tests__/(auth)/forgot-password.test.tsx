import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";

import { ForgotPasswordView } from "@/app/(auth)/forgot-password/forgot-password-view";
import * as authApi from "@/lib/api/auth";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

// Mock auth API
jest.mock("@/lib/api/auth", () => ({
  forgotPassword: jest.fn(),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("ForgotPasswordView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("renders the forgot password form", () => {
      render(<ForgotPasswordView />);

      expect(screen.getByText("Forgot password")).toBeInTheDocument();
      expect(
        screen.getByText(/Enter your email and we'll send you a link to reset your password/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /back to sign in/i })).toBeInTheDocument();
    });

    it("renders email input with correct placeholder", () => {
      render(<ForgotPasswordView />);

      const emailInput = screen.getByPlaceholderText("you@company.com");
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute("type", "email");
    });
  });

  describe("Form Validation", () => {
    it("shows validation error for invalid email format", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordView />);

      const emailInput = screen.getByLabelText(/email/i);
      const form = emailInput.closest("form");

      await user.type(emailInput, "invalid-email");
      
      // Submit the form directly to trigger validation
      if (form) {
        fireEvent.submit(form);
      }

      // Wait for react-hook-form validation to complete and error to appear
      await waitFor(
        () => {
          const errorMessage = document.querySelector('[data-slot="form-message"]');
          expect(errorMessage).toBeInTheDocument();
          expect(errorMessage?.textContent).toMatch(/valid email/i);
        },
        { timeout: 2000 }
      );
    });

    it("shows validation error for empty email", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordView />);

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it("does not submit form with invalid email", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordView />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "invalid-email");
      await user.click(submitButton);

      await waitFor(() => {
        expect(authApi.forgotPassword).not.toHaveBeenCalled();
      });
    });
  });

  describe("Successful Submission", () => {
    it("submits form with valid email", async () => {
      const user = userEvent.setup();
      const mockForgotPassword = authApi.forgotPassword as jest.MockedFunction<
        typeof authApi.forgotPassword
      >;

      mockForgotPassword.mockResolvedValue({
        message: "If that email exists in our system, you will receive a password reset email.",
      });

      render(<ForgotPasswordView />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockForgotPassword).toHaveBeenCalledWith({ email: "user@example.com" });
      });
    });

    it("shows success message after submission", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockForgotPassword = authApi.forgotPassword as jest.MockedFunction<
        typeof authApi.forgotPassword
      >;

      mockForgotPassword.mockResolvedValue({
        message: "If that email exists in our system, you will receive a password reset email.",
      });

      render(<ForgotPasswordView />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "If that email exists in our system, you will receive a password reset email."
        );
      });
    });

    it("displays success view after successful submission", async () => {
      const user = userEvent.setup();
      const mockForgotPassword = authApi.forgotPassword as jest.MockedFunction<
        typeof authApi.forgotPassword
      >;

      mockForgotPassword.mockResolvedValue({
        message: "If that email exists in our system, you will receive a password reset email.",
      });

      render(<ForgotPasswordView />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Check your email")).toBeInTheDocument();
      });

      expect(
        screen.getByText(/If an account exists for user@example.com/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/we've sent a link to reset your password/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/The link expires in 1 hour/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /back to sign in/i })).toBeInTheDocument();
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      const mockForgotPassword = authApi.forgotPassword as jest.MockedFunction<
        typeof authApi.forgotPassword
      >;

      // Delay the promise resolution to test loading state
      mockForgotPassword.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                message: "If that email exists in our system, you will receive a password reset email.",
              });
            }, 100);
          })
      );

      render(<ForgotPasswordView />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByRole("button", { name: /sending/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /sending/i })).not.toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("displays error message when API call fails", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockForgotPassword = authApi.forgotPassword as jest.MockedFunction<
        typeof authApi.forgotPassword
      >;

      const errorMessage = "Network error occurred";
      mockForgotPassword.mockRejectedValue(new Error(errorMessage));

      render(<ForgotPasswordView />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });

      // Form should still be visible (not success view)
      expect(screen.getByText("Forgot password")).toBeInTheDocument();
      expect(screen.queryByText("Check your email")).not.toBeInTheDocument();
    });

    it("displays error message from Axios error response", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockForgotPassword = authApi.forgotPassword as jest.MockedFunction<
        typeof authApi.forgotPassword
      >;

      const axiosError = new AxiosError("Request failed");
      axiosError.response = {
        data: { message: "Server error: Unable to send email" },
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        config: {} as any,
      };

      mockForgotPassword.mockRejectedValue(axiosError);

      render(<ForgotPasswordView />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Server error: Unable to send email");
      });
    });

    it("displays nested error message from Axios error response", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockForgotPassword = authApi.forgotPassword as jest.MockedFunction<
        typeof authApi.forgotPassword
      >;

      const axiosError = new AxiosError("Request failed");
      axiosError.response = {
        data: {
          message: {
            message: "Nested error message",
            error: "BadRequest",
            statusCode: 400,
          },
        },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as any,
      };

      mockForgotPassword.mockRejectedValue(axiosError);

      render(<ForgotPasswordView />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Nested error message");
      });
    });

    it("displays generic error message for unknown errors", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockForgotPassword = authApi.forgotPassword as jest.MockedFunction<
        typeof authApi.forgotPassword
      >;

      mockForgotPassword.mockRejectedValue("Unknown error");

      render(<ForgotPasswordView />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong. Please try again.");
      });
    });
  });

  describe("Navigation", () => {
    it("has link to sign-in page", () => {
      render(<ForgotPasswordView />);

      const signInLink = screen.getByRole("link", { name: /back to sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute("href", "/sign-in");
    });

    it("has link to sign-in page in success view", async () => {
      const user = userEvent.setup();
      const mockForgotPassword = authApi.forgotPassword as jest.MockedFunction<
        typeof authApi.forgotPassword
      >;

      mockForgotPassword.mockResolvedValue({
        message: "If that email exists in our system, you will receive a password reset email.",
      });

      render(<ForgotPasswordView />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        const signInLink = screen.getByRole("link", { name: /back to sign in/i });
        expect(signInLink).toBeInTheDocument();
        expect(signInLink).toHaveAttribute("href", "/sign-in");
      });
    });
  });

  describe("Form State Management", () => {
    it("clears form after successful submission", async () => {
      const user = userEvent.setup();
      const mockForgotPassword = authApi.forgotPassword as jest.MockedFunction<
        typeof authApi.forgotPassword
      >;

      mockForgotPassword.mockResolvedValue({
        message: "If that email exists in our system, you will receive a password reset email.",
      });

      render(<ForgotPasswordView />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "user@example.com");
      expect(emailInput.value).toBe("user@example.com");

      await user.click(submitButton);

      await waitFor(() => {
        // Form should be replaced by success view
        expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      });
    });

    it("keeps form visible after error", async () => {
      const user = userEvent.setup();
      const mockForgotPassword = authApi.forgotPassword as jest.MockedFunction<
        typeof authApi.forgotPassword
      >;

      mockForgotPassword.mockRejectedValue(new Error("Network error"));

      render(<ForgotPasswordView />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        // Form should still be visible
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(emailInput.value).toBe("user@example.com");
      });
    });
  });
});
