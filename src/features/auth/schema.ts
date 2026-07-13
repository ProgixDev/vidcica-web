import { z } from "zod";

/** Auth input contract — validated at the edge before any network call. */
export const CredentialsSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type Credentials = z.infer<typeof CredentialsSchema>;

/** Phone in E.164 (e.g. +33612345678) — the same identity users have on mobile. */
export const PhoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, "Enter a phone number in international format (+33…)"),
});
export type PhoneInput = z.infer<typeof PhoneSchema>;

/** The 6-digit SMS code. */
export const OtpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "The code is 6 digits"),
});
export type OtpInput = z.infer<typeof OtpSchema>;
