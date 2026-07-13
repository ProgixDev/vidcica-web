import { z } from "zod";

/** Auth input contract — validated at the edge before any network call. */
export const CredentialsSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export type Credentials = z.infer<typeof CredentialsSchema>;

/** Phone in E.164 (e.g. +33612345678) — the same identity users have on mobile. */
export const PhoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, "Numéro au format international (+33…)"),
});
export type PhoneInput = z.infer<typeof PhoneSchema>;

/** The 6-digit SMS code. */
export const OtpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Le code contient 6 chiffres"),
});
export type OtpInput = z.infer<typeof OtpSchema>;
