import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NetworkList } from "./network-list";
import type { Network } from "@/lib/vidcica/network";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
afterEach(cleanup);

const net = (platform: Network["platform"], over: Partial<Network> = {}): Network => ({
  id: `id-${platform}`,
  platform,
  name: platform,
  connected: true,
  needsReconnect: false,
  publishesEnabled: true,
  handle: `@${platform}`,
  ...over,
});

describe("<NetworkList /> (AC-1, AC-4 states)", () => {
  it("renders every platform with its status", () => {
    render(
      <NetworkList
        initial={[net("youtube"), net("linkedin", { connected: false, needsReconnect: false })]}
      />,
    );
    // Connected YouTube shows handle + no connect button
    expect(screen.getByTestId("network-status-youtube")).toHaveTextContent("Connecté");
    expect(screen.getByText("@youtube")).toBeInTheDocument();
    // Disconnected LinkedIn offers connect
    expect(screen.getByTestId("connect-linkedin")).toBeInTheDocument();
    // X is dropped entirely (paid API) — not rendered at all
    expect(screen.queryByTestId("network-x")).not.toBeInTheDocument();
  });

  it("shows reconnect for a needs-reconnect account", () => {
    render(<NetworkList initial={[net("youtube", { needsReconnect: true })]} />);
    expect(screen.getByTestId("network-status-youtube")).toHaveTextContent("Reconnexion requise");
    expect(screen.getByRole("button", { name: "Reconnecter" })).toBeInTheDocument();
  });
});
