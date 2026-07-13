import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SupportChat } from "./support-chat";
import { SupportStoreProvider } from "../provider";
import type { AskSupportOutcome } from "@/lib/vidcica/support";

afterEach(cleanup);

function renderChat(ask: () => Promise<AskSupportOutcome>, onHandoff = vi.fn()) {
  render(
    <SupportStoreProvider deps={{ ask }}>
      <SupportChat onHandoff={onHandoff} />
    </SupportStoreProvider>,
  );
  return { onHandoff };
}

describe("<SupportChat /> (AC-1/3/5)", () => {
  it("sends a message and shows Lia's reply with a suggestion", async () => {
    renderChat(async () => ({
      ok: true,
      reply: "Voici comment créer une vidéo.",
      suggestions: ["Créer une vidéo"],
      handoff: false,
    }));
    fireEvent.change(screen.getByTestId("chat-input"), { target: { value: "Comment créer ?" } });
    fireEvent.click(screen.getByTestId("chat-send"));
    expect(await screen.findByText("Voici comment créer une vidéo.")).toBeInTheDocument();
    expect(screen.getByText("Comment créer ?")).toBeInTheDocument(); // user turn
    expect(screen.getByText("Créer une vidéo")).toBeInTheDocument(); // suggestion chip
  });

  it("a contact-form suggestion triggers the handoff instead of sending", async () => {
    const { onHandoff } = renderChat(async () => ({
      ok: true,
      reply: "Je transfère votre demande.",
      suggestions: [],
      handoff: true, // store appends the contact chip
    }));
    fireEvent.change(screen.getByTestId("chat-input"), { target: { value: "paiement" } });
    fireEvent.click(screen.getByTestId("chat-send"));
    const chip = await screen.findByText(/formulaire de contact/i);
    fireEvent.click(chip);
    expect(onHandoff).toHaveBeenCalled();
  });
});
