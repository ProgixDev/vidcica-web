import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppleButton } from "./apple-button";
import { GoogleButton } from "./google-button";

const searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({ useSearchParams: () => searchParams }));

type OAuthResult = { error: { message: string } | null };
const signInWithOAuth = vi.fn<() => Promise<OAuthResult>>(async () => ({ error: null }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithOAuth: (...a: unknown[]) => signInWithOAuth(...(a as [])) },
  }),
}));

afterEach(() => {
  cleanup();
  signInWithOAuth.mockClear();
  signInWithOAuth.mockResolvedValue({ error: null });
  searchParams.delete("next");
});

describe("<AppleButton /> — parity with the mobile Apple sign-in", () => {
  it("starts the Apple OAuth flow and returns through /auth/callback", async () => {
    render(<AppleButton />);
    fireEvent.click(screen.getByTestId("auth-apple"));
    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledTimes(1));
    const [arg] = signInWithOAuth.mock.calls[0] as unknown as [
      { provider: string; options: { redirectTo: string } },
    ];
    expect(arg.provider).toBe("apple");
    const redirect = new URL(arg.options.redirectTo);
    expect(redirect.pathname).toBe("/auth/callback");
    expect(redirect.searchParams.get("provider")).toBe("apple");
    // Default landing page when no ?next= was supplied.
    expect(redirect.searchParams.get("next")).toBe("/dashboard");
  });

  it("honours a safe ?next= and rejects an open redirect (SEC-REDIR-001)", async () => {
    searchParams.set("next", "/videos");
    render(<AppleButton />);
    fireEvent.click(screen.getByTestId("auth-apple"));
    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledTimes(1));
    let arg = signInWithOAuth.mock.calls[0] as unknown as [{ options: { redirectTo: string } }];
    expect(new URL(arg[0].options.redirectTo).searchParams.get("next")).toBe("/videos");

    cleanup();
    signInWithOAuth.mockClear();
    searchParams.set("next", "https://evil.example/steal");
    render(<AppleButton />);
    fireEvent.click(screen.getByTestId("auth-apple"));
    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledTimes(1));
    arg = signInWithOAuth.mock.calls[0] as unknown as [{ options: { redirectTo: string } }];
    expect(new URL(arg[0].options.redirectTo).searchParams.get("next")).toBe("/dashboard");
  });

  it("surfaces a provider error instead of hanging on the pending label", async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: { message: "Unsupported provider" } });
    render(<AppleButton />);
    fireEvent.click(screen.getByTestId("auth-apple"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unsupported provider");
    expect(screen.getByTestId("auth-apple")).not.toBeDisabled();
  });
});

describe("<GoogleButton /> — unchanged by the shared flow", () => {
  it("still starts the Google OAuth flow", async () => {
    render(<GoogleButton />);
    fireEvent.click(screen.getByTestId("auth-google"));
    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledTimes(1));
    const [arg] = signInWithOAuth.mock.calls[0] as unknown as [
      { provider: string; options: { redirectTo: string } },
    ];
    expect(arg.provider).toBe("google");
    expect(new URL(arg.options.redirectTo).searchParams.get("provider")).toBe("google");
  });
});
