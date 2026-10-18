import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NetworkList } from "./network-list";
import type { Network } from "@/lib/vidcica/network";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

// The server actions, controlled per test.
const actions = vi.hoisted(() => ({
  disconnectNetwork: vi.fn(async () => ({ ok: true as const })),
  setNetworkPublish: vi.fn(async () => ({ ok: true as const })),
  selectMetaPage: vi.fn(async () => ({ ok: true as const })),
  disconnectMeta: vi.fn(),
}));
vi.mock("../actions", () => actions);

afterEach(() => {
  cleanup();
  refresh.mockClear();
  vi.restoreAllMocks();
  for (const fn of Object.values(actions)) fn.mockClear();
});

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

describe("<NetworkList /> — Meta", () => {
  it("says why a Meta card couldn’t connect (stored by the server)", () => {
    render(
      <NetworkList
        reviewAccess
        initial={[
          net("facebook"),
          net("instagram", { connected: false, connectReason: "instagram_not_linked" }),
        ]}
      />,
    );
    expect(screen.getByTestId("network-reason-instagram")).toHaveTextContent(
      "Instagram professionnel",
    );
    // The connected Facebook card shows no reason line.
    expect(screen.queryByTestId("network-reason-facebook")).not.toBeInTheDocument();
  });

  it("offers a Page picker only when several Pages were shared", () => {
    const pages = [
      { id: "111", name: "Vidcica", igUsername: "vidcica" },
      { id: "222", name: "Autre", igUsername: null },
    ];
    const { unmount } = render(
      <NetworkList reviewAccess initial={[net("facebook", { pageId: "111", pages })]} />,
    );
    expect(screen.getByTestId("network-page-select")).toHaveValue("111");
    unmount();
    render(
      <NetworkList
        reviewAccess
        initial={[net("facebook", { pageId: "111", pages: pages.slice(0, 1) })]}
      />,
    );
    expect(screen.queryByTestId("network-page-select")).not.toBeInTheDocument();
  });

  it("sends a new Page choice to the server, then re-reads", async () => {
    const pages = [
      { id: "111", name: "Vidcica", igUsername: "vidcica" },
      { id: "222", name: "Autre", igUsername: null },
    ];
    render(<NetworkList reviewAccess initial={[net("facebook", { pageId: "111", pages })]} />);
    fireEvent.change(screen.getByTestId("network-page-select"), { target: { value: "222" } });
    await waitFor(() => expect(actions.selectMetaPage).toHaveBeenCalledWith("222"));
    expect(refresh).toHaveBeenCalled();
  });

  it("asks before a Meta disconnect, and offers a way out when a Boost won’t pause", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    actions.disconnectMeta
      .mockResolvedValueOnce({
        ok: false,
        reason: "pause_failed",
        campaigns: ["Boost — promo"],
        adsManagerUrl: "https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=1",
      })
      .mockResolvedValueOnce({ ok: true, stillRunning: 1, adsManagerUrl: null });
    render(<NetworkList reviewAccess initial={[net("facebook")]} />);

    fireEvent.click(screen.getByRole("button", { name: "Déconnecter" }));
    expect(window.confirm).toHaveBeenCalled();
    const panel = await screen.findByTestId("meta-pause-failed");
    expect(panel).toHaveTextContent("Boost — promo");
    expect(actions.disconnectMeta).toHaveBeenLastCalledWith(false);
    // Nothing was disconnected yet; the plain row update is never used for Meta.
    expect(actions.disconnectNetwork).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("meta-disconnect-anyway"));
    await waitFor(() => expect(actions.disconnectMeta).toHaveBeenLastCalledWith(true));
  });

  it("does nothing when the person cancels the Meta disconnect", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<NetworkList reviewAccess initial={[net("instagram")]} />);
    fireEvent.click(screen.getByRole("button", { name: "Déconnecter" }));
    expect(actions.disconnectMeta).not.toHaveBeenCalled();
  });
});
