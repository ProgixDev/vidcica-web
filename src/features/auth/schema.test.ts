import { describe, expect, it } from "vitest";
import {
  CredentialsSchema,
  ResetPasswordSchema,
  SignUpCredentialsSchema,
  isWeakPasswordError,
  meetsPasswordPolicy,
} from "./schema";

// Verbatim from the Supabase 422 refusal: the symbols the server accepts.
const SERVER_SYMBOLS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

describe("meetsPasswordPolicy", () => {
  it("needs a lowercase, an uppercase, a digit and a symbol, 8 characters minimum", () => {
    expect(meetsPasswordPolicy("Motdepasse1!")).toBe(true);
    expect(meetsPasswordPolicy("motdepasse")).toBe(false);
    expect(meetsPasswordPolicy("Motdepasse1")).toBe(false);
    expect(meetsPasswordPolicy("MOTDEPASSE1!")).toBe(false);
    expect(meetsPasswordPolicy("Ab1!")).toBe(false);
  });

  it("counts every symbol the server counts", () => {
    for (const symbol of SERVER_SYMBOLS) {
      expect(meetsPasswordPolicy(`Abcdefg1${symbol}`), symbol).toBe(true);
    }
  });

  it("does not count what the server does not: accents and spaces", () => {
    // "é" is neither a-z nor a listed symbol for Supabase, so a password whose
    // only "special" character is an accent is refused there.
    expect(meetsPasswordPolicy("Motdepassé1")).toBe(false);
    expect(meetsPasswordPolicy("Mot de passe1")).toBe(false);
  });
});

describe("password schemas", () => {
  const email = "test@example.com";

  it("enforces the policy on sign-up and reset", () => {
    expect(SignUpCredentialsSchema.safeParse({ email, password: "motdepasse" }).success).toBe(
      false,
    );
    expect(
      ResetPasswordSchema.safeParse({ password: "motdepasse", confirm: "motdepasse" }).success,
    ).toBe(false);
    expect(SignUpCredentialsSchema.safeParse({ email, password: "Motdepasse1!" }).success).toBe(
      true,
    );
  });

  it("leaves sign-in alone so older accounts can still get in", () => {
    expect(CredentialsSchema.safeParse({ email, password: "motdepasse" }).success).toBe(true);
  });
});

describe("isWeakPasswordError", () => {
  it("recognises the server's refusal", () => {
    expect(
      isWeakPasswordError(
        "Password should contain at least one character of each: abcdefghijklmnopqrstuvwxyz",
      ),
    ).toBe(true);
    expect(isWeakPasswordError("Invalid login credentials")).toBe(false);
  });
});
