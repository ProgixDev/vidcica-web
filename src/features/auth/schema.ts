import { z } from "zod";

/** Auth input contract — validated at the edge before any network call. */
export const CredentialsSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export type Credentials = z.infer<typeof CredentialsSchema>;

/**
 * The Supabase Auth password policy: a lowercase letter, an uppercase letter,
 * a digit and a symbol, with the server's exact character sets (an accented
 * "é" counts as none of them there, so none here either). Mirrors the app's
 * `meetsPasswordPolicy`. Without it the form accepted any 8 characters and the
 * server refused them with a 422.
 */
const PASSWORD_SYMBOLS = /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/;
export function meetsPasswordPolicy(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    PASSWORD_SYMBOLS.test(password)
  );
}

const NewPasswordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .refine(meetsPasswordPolicy, "Il faut une minuscule, une majuscule, un chiffre et un symbole");

/** Sign-up enforces the policy; sign-in keeps `CredentialsSchema` so accounts
 *  created before the policy can still get in. */
export const SignUpCredentialsSchema = CredentialsSchema.extend({ password: NewPasswordSchema });

/** True for the server's policy refusal, so the form can say it in the user's
 *  language instead of echoing Supabase's English character list. */
export function isWeakPasswordError(message: string): boolean {
  return /password should|weak password/i.test(message);
}

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

/** Forgot-password: just the address to send the recovery link to. */
export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide"),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/** New-password form on the reset page — password + confirmation must match. */
export const ResetPasswordSchema = z
  .object({
    password: NewPasswordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/** Optional signup enrichment captured once, in the sign-up form. Both fields
 *  are optional — the user can skip them and fill their profile later. */
export const SignupEnrichmentSchema = z.object({
  niche: z.string().trim().max(40),
  audience: z.string().trim().max(280),
});
export type SignupEnrichmentInput = z.infer<typeof SignupEnrichmentSchema>;
