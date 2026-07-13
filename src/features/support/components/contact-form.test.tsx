import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "./contact-form";

type TicketResult = { ok: true } | { ok: false; message: string };
const submitTicket = vi.fn<() => Promise<TicketResult>>(async () => ({ ok: true }));
vi.mock("../actions", () => ({
  submitTicket: (...a: unknown[]) => submitTicket(...(a as [])),
}));

afterEach(() => {
  cleanup();
  submitTicket.mockClear();
});

describe("<ContactForm /> (AC-6/7)", () => {
  it("submits a valid ticket and shows a confirmation", async () => {
    render(<ContactForm />);
    fireEvent.change(screen.getByTestId("contact-subject"), {
      target: { value: "Problème de publication" },
    });
    fireEvent.change(screen.getByTestId("contact-message"), {
      target: { value: "La publication ne fonctionne pas." },
    });
    fireEvent.click(screen.getByTestId("contact-submit"));
    expect(await screen.findByText("Message envoyé")).toBeInTheDocument();
    expect(submitTicket).toHaveBeenCalledWith({
      subject: "Problème de publication",
      message: "La publication ne fonctionne pas.",
    });
  });

  it("shows the server error when a valid submit fails (AC-8)", async () => {
    submitTicket.mockResolvedValueOnce({ ok: false, message: "Échec de l’envoi. Réessayez." });
    render(<ContactForm />);
    fireEvent.change(screen.getByTestId("contact-subject"), {
      target: { value: "Sujet valable" },
    });
    fireEvent.change(screen.getByTestId("contact-message"), {
      target: { value: "Un message suffisamment long." },
    });
    fireEvent.click(screen.getByTestId("contact-submit"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Échec de l’envoi. Réessayez.");
    expect(screen.queryByText("Message envoyé")).not.toBeInTheDocument();
  });

  it("rejects too-short input inline without submitting (AC-7)", () => {
    render(<ContactForm />);
    fireEvent.change(screen.getByTestId("contact-subject"), { target: { value: "x" } });
    fireEvent.change(screen.getByTestId("contact-message"), { target: { value: "court" } });
    fireEvent.click(screen.getByTestId("contact-submit"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(submitTicket).not.toHaveBeenCalled();
  });
});
