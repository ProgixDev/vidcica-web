import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutReturnView } from "./view";

const posted: unknown[] = [];
class FakeChannel {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  postMessage(m: unknown) {
    posted.push({ channel: this.name, message: m });
  }
  close() {}
}

let replace: ReturnType<typeof vi.fn>;
beforeEach(() => {
  posted.length = 0;
  vi.useFakeTimers();
  vi.stubGlobal("BroadcastChannel", FakeChannel);
  replace = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, origin: "https://www.vidcica.com", replace },
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Object.defineProperty(window, "opener", { configurable: true, value: null });
});

describe("<CheckoutReturnView /> (AC-13)", () => {
  it("tells the Vidcica window what happened, on our origin only, then closes", () => {
    const postMessage = vi.fn();
    Object.defineProperty(window, "opener", { configurable: true, value: { postMessage } });
    const close = vi.fn();
    vi.stubGlobal("close", close);
    render(<CheckoutReturnView status="success" />);
    expect(screen.getByRole("heading")).toHaveTextContent("Paiement reçu");
    expect(posted).toEqual([
      { channel: "vidcica:billing", message: { type: "vidcica:billing", status: "success" } },
    ]);
    expect(postMessage).toHaveBeenCalledWith(
      { type: "vidcica:billing", status: "success" },
      "https://www.vidcica.com",
    );
    vi.advanceTimersByTime(1600);
    expect(close).toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("without an opener (popup blocked), goes to the billing page with the status", () => {
    render(<CheckoutReturnView status="cancel" />);
    expect(replace).toHaveBeenCalledWith("/billing?status=cancel");
    // The channel still tells any other Vidcica tab.
    expect(posted).toHaveLength(1);
  });
});
