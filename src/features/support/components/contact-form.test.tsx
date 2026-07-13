import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "./contact-form";

const submitTicket = vi.fn(async () => ({ ok: true as const }));
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

  it("rejects too-short input inline without submitting (AC-7)", () => {
    render(<ContactForm />);
    fireEvent.change(screen.getByTestId("contact-subject"), { target: { value: "x" } });
    fireEvent.change(screen.getByTestId("contact-message"), { target: { value: "court" } });
    fireEvent.click(screen.getByTestId("contact-submit"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(submitTicket).not.toHaveBeenCalled();
  });
});
