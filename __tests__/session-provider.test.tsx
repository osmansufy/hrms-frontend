import { act, renderHook, waitFor } from "@testing-library/react";

import { SessionProvider, useSession } from "@/components/auth/session-provider";

jest.mock("@/lib/api/client", () => {
  return {
    apiClient: {
      post: jest.fn(() =>
        Promise.resolve({
          data: { accessToken: "test-token", refreshToken: "test-refresh" },
        }),
      ),
    },
    setAuthToken: jest.fn(),
  };
});

describe("SessionProvider", () => {
  it("signs in a user and exposes session data", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));

    await act(async () => {
      await result.current.signIn({ email: "tester@example.com", password: "password" });
    });

    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.session?.user.email).toBe("tester@example.com");
  });
});
