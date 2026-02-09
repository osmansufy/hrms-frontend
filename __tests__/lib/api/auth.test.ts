import { AxiosError } from "axios";

import { forgotPassword, resetPassword } from "@/lib/api/auth";
import { apiClient } from "@/lib/api/client-with-refresh";

// Mock the API client
jest.mock("@/lib/api/client-with-refresh", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe("Auth API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("forgotPassword", () => {
    it("calls the correct API endpoint with email", async () => {
      const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
      const mockResponse = {
        data: {
          message: "If that email exists in our system, you will receive a password reset email.",
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await forgotPassword({ email: "user@example.com" });

      expect(mockPost).toHaveBeenCalledWith("/auth/forgot-password", {
        email: "user@example.com",
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("returns response with resetToken in non-production", async () => {
      const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
      const mockResponse = {
        data: {
          message: "If that email exists in our system, you will receive a password reset email.",
          resetToken: "test-reset-token-123",
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await forgotPassword({ email: "user@example.com" });

      expect(result).toEqual(mockResponse.data);
      expect(result.resetToken).toBe("test-reset-token-123");
    });

    it("throws error when API call fails", async () => {
      const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
      const axiosError = new AxiosError("Request failed");
      axiosError.response = {
        data: { message: "Server error" },
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        config: {} as any,
      };

      mockPost.mockRejectedValue(axiosError);

      await expect(forgotPassword({ email: "user@example.com" })).rejects.toThrow();
      expect(mockPost).toHaveBeenCalledWith("/auth/forgot-password", {
        email: "user@example.com",
      });
    });
  });

  describe("resetPassword", () => {
    it("calls the correct API endpoint with token and newPassword", async () => {
      const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
      const mockResponse = {
        data: {
          message: "Password reset successful. Please login with your new password.",
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await resetPassword({
        token: "reset-token-123",
        newPassword: "NewPassword123!",
      });

      expect(mockPost).toHaveBeenCalledWith("/auth/reset-password", {
        token: "reset-token-123",
        newPassword: "NewPassword123!",
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("returns success message on successful reset", async () => {
      const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
      const mockResponse = {
        data: {
          message: "Password reset successful. Please login with your new password.",
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await resetPassword({
        token: "reset-token-123",
        newPassword: "NewPassword123!",
      });

      expect(result.message).toBe("Password reset successful. Please login with your new password.");
    });

    it("throws error when token is invalid", async () => {
      const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
      const axiosError = new AxiosError("Request failed");
      axiosError.response = {
        data: { message: "Invalid or expired password reset token" },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as any,
      };

      mockPost.mockRejectedValue(axiosError);

      await expect(
        resetPassword({
          token: "invalid-token",
          newPassword: "NewPassword123!",
        })
      ).rejects.toThrow();

      expect(mockPost).toHaveBeenCalledWith("/auth/reset-password", {
        token: "invalid-token",
        newPassword: "NewPassword123!",
      });
    });

    it("throws error when password validation fails", async () => {
      const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
      const axiosError = new AxiosError("Request failed");
      axiosError.response = {
        data: {
          message: {
            message: "Password must contain uppercase, lowercase, number/special character",
            error: "BadRequest",
            statusCode: 400,
          },
        },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as any,
      };

      mockPost.mockRejectedValue(axiosError);

      await expect(
        resetPassword({
          token: "valid-token",
          newPassword: "weakpassword",
        })
      ).rejects.toThrow();
    });
  });
});
