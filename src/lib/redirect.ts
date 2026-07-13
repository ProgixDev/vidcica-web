/**
 * Open-redirect guard. A `?next=`/`returnTo` style param is untrusted input —
 * redirecting to an attacker-controlled absolute URL is a classic phishing vector.
 * Only same-origin relative paths (or an explicitly allowlisted host) are allowed;
 * everything else falls back to a safe default. See docs/security/checklist.md (SEC-REDIR-001).
 */

/** Absolute hosts an external redirect may target (https only). Usually empty. */
const ALLOWED_HOSTS: readonly string[] = [];

/** Backslash (→ "/" normalization), whitespace, and ASCII control chars are all
 *  open-redirect bypass vectors (e.g. "/\evil.com" resolves to https://evil.com). */
function hasUnsafeChars(s: string): boolean {
  if (s.includes("\\")) return true;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    // C0 controls + space (0x20) and below, and DEL (0x7f).
    if (code <= 0x20 || code === 0x7f) return true;
  }
  return false;
}

export function safeRedirectPath(target: string | null | undefined, fallback = "/"): string {
  if (!target) return fallback;
  if (hasUnsafeChars(target)) return fallback;
  try {
    // Same-origin relative path — but reject protocol-relative "//evil.com".
    if (target.startsWith("/") && !target.startsWith("//")) return target;

    const url = new URL(target);
    if (url.protocol === "https:" && ALLOWED_HOSTS.includes(url.hostname)) {
      return url.toString();
    }
    return fallback;
  } catch {
    // Not a parseable URL and not a clean relative path → unsafe.
    return fallback;
  }
}
