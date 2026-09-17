import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TrackedLink } from "./tracked-link";

const capture = vi.fn();
vi.mock("@/lib/analytics/provider", () => ({
  useAnalytics: () => ({ capture, consent: null, askConsent: false, setConsent: () => {} }),
}));

afterEach(() => {
  cleanup();
  capture.mockClear();
});

describe("<TrackedLink />", () => {
  it("records the CTA with its location and destination", () => {
    render(
      <TrackedLink href="/sign-in" location="pricing:pro">
        Choose Pro
      </TrackedLink>,
    );
    fireEvent.click(screen.getByText("Choose Pro"));
    expect(capture).toHaveBeenCalledWith("cta_clicked", {
      location: "pricing:pro",
      href: "/sign-in",
    });
  });

  it("still navigates — it renders a real link, not a button", () => {
    render(
      <TrackedLink href="/tarifs" location="hero">
        Pricing
      </TrackedLink>,
    );
    // A CTA that only fires an event and swallows the click would break the page
    // for anyone who blocks analytics.
    expect(screen.getByText("Pricing").getAttribute("href")).toBe("/tarifs");
  });

  it("keeps a caller's own onClick", () => {
    const onClick = vi.fn();
    render(
      <TrackedLink href="/sign-in" location="hero" onClick={onClick}>
        Start
      </TrackedLink>,
    );
    fireEvent.click(screen.getByText("Start"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledTimes(1);
  });
});
