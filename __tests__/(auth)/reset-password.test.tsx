import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";

import { ResetPasswordView } from "@/app/(auth)/reset-password/reset-password-view";
import * as authApi from "@/lib/api/auth";

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
  })),
}));

// Mock auth API
jest.mock("@/lib/api/auth", () => ({
  resetPassword: jest.fn(),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("ResetPasswordView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  describe("Invalid Token", () => {
    it("displays error message when token is missing", () => {
      render(<ResetPasswordView token={null} />);

      expect(screen.getByText("Invalid reset link")).toBeInTheDocument();
      expect(
        screen.getByText(/This password reset link is missing or invalid/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Request a new one from the sign-in page/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /request new reset link/i })).toBeInTheDocument();
    });

    it("has link to forgot-password page when token is missing", () => {
      render(<ResetPasswordView token={null} />);

      const forgotPasswordLink = screen.getByRole("link", { name: /request new reset link/i });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
    });
  });

  describe("Initial Render with Valid Token", () => {
    it("renders the reset password form", () => {
      render(<ResetPasswordView token="valid-token-123" />);

      expect(screen.getByText("Set new password")).toBeInTheDocument();
      expect(
        screen.getByText(/Enter your new password below/i)
      ).toBeInTheDocument();
      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      expect(passwordInputs).toHaveLength(2);
      expect(screen.getByRole("button", { name: /reset password/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /back to sign in/i })).toBeInTheDocument();
    });

    it("renders password inputs with correct placeholders", () => {
      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      expect(passwordInputs).toHaveLength(2);
      passwordInputs.forEach((input) => {
        expect(input).toHaveAttribute("type", "password");
      });
    });

    it("renders password visibility toggles", () => {
      render(<ResetPasswordView token="valid-token-123" />);

      // Find toggle buttons by their SVG icons (Eye/EyeOff)
      const eyeIcons = document.querySelectorAll('svg[class*="lucide-eye"]');
      expect(eyeIcons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Password Visibility Toggle", () => {
    it("toggles password visibility for new password field", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      ) as HTMLInputElement;
      expect(newPasswordInput).toBeInTheDocument();
      expect(newPasswordInput).toHaveAttribute("type", "password");

      // Find the toggle button next to the new password input
      const toggleButton = newPasswordInput.parentElement?.querySelector('button[type="button"]');
      expect(toggleButton).toBeInTheDocument();

      await user.click(toggleButton!);

      await waitFor(() => {
        expect(newPasswordInput).toHaveAttribute("type", "text");
      });
    });

    it("toggles password visibility for confirm password field", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const confirmPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "confirmPassword"
      ) as HTMLInputElement;
      
      expect(confirmPasswordInput).toBeInTheDocument();
      expect(confirmPasswordInput).toHaveAttribute("type", "password");

      // Find the toggle button next to the confirm password input
      const toggleButton = confirmPasswordInput.parentElement?.querySelector('button[type="button"]');
      expect(toggleButton).toBeInTheDocument();

      await user.click(toggleButton!);

      await waitFor(() => {
        expect(confirmPasswordInput).toHaveAttribute("type", "text");
      });
    });
  });

  describe("Form Validation", () => {
    it("shows validation error for password less than 8 characters", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      )!;
      const form = newPasswordInput.closest("form");

      await user.type(newPasswordInput, "Short1");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        const errorMessage = document.querySelector('[data-slot="form-message"]');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage?.textContent).toMatch(/at least 8 characters/i);
      });
    });

    it("shows validation error for password without uppercase", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      )!;
      const confirmPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "confirmPassword"
      )!;
      const form = newPasswordInput.closest("form");

      await user.type(newPasswordInput, "lowercase123");
      await user.type(confirmPasswordInput, "lowercase123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        const errorMessage = document.querySelector('[data-slot="form-message"]');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage?.textContent).toMatch(/uppercase/i);
      });
    });

    it("shows validation error for password without lowercase", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      )!;
      const confirmPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "confirmPassword"
      )!;
      const form = newPasswordInput.closest("form");

      await user.type(newPasswordInput, "UPPERCASE123");
      await user.type(confirmPasswordInput, "UPPERCASE123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        const errorMessage = document.querySelector('[data-slot="form-message"]');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage?.textContent).toMatch(/uppercase/i);
      });
    });

    it("shows validation error for password without number or special character", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      )!;
      const confirmPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "confirmPassword"
      )!;
      const form = newPasswordInput.closest("form");

      await user.type(newPasswordInput, "NoNumbersOrSpecial");
      await user.type(confirmPasswordInput, "NoNumbersOrSpecial");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        const errorMessage = document.querySelector('[data-slot="form-message"]');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage?.textContent).toMatch(/uppercase/i);
      });
    });

    it("shows validation error when passwords do not match", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      )!;
      const confirmPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "confirmPassword"
      )!;
      const form = newPasswordInput.closest("form");

      await user.type(newPasswordInput, "ValidPass123");
      await user.type(confirmPasswordInput, "DifferentPass123");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        const errorMessages = document.querySelectorAll('[data-slot="form-message"]');
        const matchError = Array.from(errorMessages).find((msg) =>
          msg.textContent?.match(/passwords do not match/i)
        );
        expect(matchError).toBeInTheDocument();
      });
    });

    it("does not submit form with invalid password", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      )!;
      const form = newPasswordInput.closest("form");

      await user.type(newPasswordInput, "short");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(authApi.resetPassword).not.toHaveBeenCalled();
      });
    });
  });

  describe("Successful Submission", () => {
    it("submits form with valid password", async () => {
      const user = userEvent.setup();
      const mockResetPassword = authApi.resetPassword as jest.MockedFunction<
        typeof authApi.resetPassword
      >;

      mockResetPassword.mockResolvedValue({
        message: "Password reset successful. Please login with your new password.",
      });

      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      )!;
      const confirmPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "confirmPassword"
      )!;
      const form = newPasswordInput.closest("form");

      await user.type(newPasswordInput, "NewPassword123!");
      await user.type(confirmPasswordInput, "NewPassword123!");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith({
          token: "valid-token-123",
          newPassword: "NewPassword123!",
        });
      });
    });

    it("shows success message after submission", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockResetPassword = authApi.resetPassword as jest.MockedFunction<
        typeof authApi.resetPassword
      >;

      mockResetPassword.mockResolvedValue({
        message: "Password reset successful. Please login with your new password.",
      });

      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      )!;
      const confirmPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "confirmPassword"
      )!;
      const form = newPasswordInput.closest("form");

      await user.type(newPasswordInput, "NewPassword123!");
      await user.type(confirmPasswordInput, "NewPassword123!");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Password reset successfully. Please sign in with your new password."
        );
      });
    });

    it("redirects to sign-in page after successful submission", async () => {
      const user = userEvent.setup();
      const mockResetPassword = authApi.resetPassword as jest.MockedFunction<
        typeof authApi.resetPassword
      >;

      mockResetPassword.mockResolvedValue({
        message: "Password reset successful. Please login with your new password.",
      });

      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      )!;
      const confirmPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "confirmPassword"
      )!;
      const form = newPasswordInput.closest("form");

      await user.type(newPasswordInput, "NewPassword123!");
      await user.type(confirmPasswordInput, "NewPassword123!");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/sign-in");
      });
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      const mockResetPassword = authApi.resetPassword as jest.MockedFunction<
        typeof authApi.resetPassword
      >;

      // Delay the promise resolution to test loading state
      mockResetPassword.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                message: "Password reset successful. Please login with your new password.",
              });
            }, 100);
          })
      );

      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      )!;
      const confirmPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "confirmPassword"
      )!;
      const form = newPasswordInput.closest("form");

      await user.type(newPasswordInput, "NewPassword123!");
      await user.type(confirmPasswordInput, "NewPassword123!");
      if (form) {
        fireEvent.submit(form);
      }

      // Check loading state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /resetting/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /resetting/i })).toBeDisabled();
      });

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /resetting/i })).not.toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("displays error message when API call fails", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockResetPassword = authApi.resetPassword as jest.MockedFunction<
        typeof authApi.resetPassword
      >;

      const errorMessage = "Network error occurred";
      mockResetPassword.mockRejectedValue(new Error(errorMessage));

      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      )!;
      const confirmPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "confirmPassword"
      )!;
      const form = newPasswordInput.closest("form");

      await user.type(newPasswordInput, "NewPassword123!");
      await user.type(confirmPasswordInput, "NewPassword123!");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });

      // Form should still be visible (not redirected)
      expect(screen.getByText("Set new password")).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("displays error message from Axios error response", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockResetPassword = authApi.resetPassword as jest.MockedFunction<
        typeof authApi.resetPassword
      >;

      const axiosError = new AxiosError("Request failed");
      axiosError.response = {
        data: { message: "Invalid or expired password reset token" },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as any,
      };

      mockResetPassword.mockRejectedValue(axiosError);

      render(<ResetPasswordView token="expired-token" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      )!;
      const confirmPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "confirmPassword"
      )!;
      const form = newPasswordInput.closest("form");

      await user.type(newPasswordInput, "NewPassword123!");
      await user.type(confirmPasswordInput, "NewPassword123!");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Invalid or expired password reset token");
      });
    });

    it("displays nested error message from Axios error response", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockResetPassword = authApi.resetPassword as jest.MockedFunction<
        typeof authApi.resetPassword
      >;

      const axiosError = new AxiosError("Request failed");
      axiosError.response = {
        data: {
          message: {
            message: "Token has expired",
            error: "BadRequest",
            statusCode: 400,
          },
        },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as any,
      };

      mockResetPassword.mockRejectedValue(axiosError);

      render(<ResetPasswordView token="expired-token" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      )!;
      const confirmPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "confirmPassword"
      )!;
      const form = newPasswordInput.closest("form");

      await user.type(newPasswordInput, "NewPassword123!");
      await user.type(confirmPasswordInput, "NewPassword123!");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Token has expired");
      });
    });

    it("displays generic error message for unknown errors", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockResetPassword = authApi.resetPassword as jest.MockedFunction<
        typeof authApi.resetPassword
      >;

      mockResetPassword.mockRejectedValue("Unknown error");

      render(<ResetPasswordView token="valid-token-123" />);

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const newPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "newPassword"
      )!;
      const confirmPasswordInput = passwordInputs.find(
        (input) => (input as HTMLInputElement).name === "confirmPassword"
      )!;
      const form = newPasswordInput.closest("form");

      await user.type(newPasswordInput, "NewPassword123!");
      await user.type(confirmPasswordInput, "NewPassword123!");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong. Please try again.");
      });
    });
  });

  describe("Navigation", () => {
    it("has link to sign-in page", () => {
      render(<ResetPasswordView token="valid-token-123" />);

      const signInLink = screen.getByRole("link", { name: /back to sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute("href", "/sign-in");
    });
  });

  describe("Password Requirements Display", () => {
    it("displays password requirements in description", () => {
      render(<ResetPasswordView token="valid-token-123" />);

      expect(
        screen.getByText(/It must be at least 8 characters with uppercase/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/lowercase, and a number or special character/i)
      ).toBeInTheDocument();
    });
  });
});
