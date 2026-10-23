/** Reject invalid local configuration without interpreting it as an authenticated session. */
export function validCloudConfig(url: unknown, key: unknown): boolean {
  if (typeof url !== "string" || typeof key !== "string") return false;
  const placeholder = /placeholder|your[-_ ]|example|changeme|replace[-_ ]|undefined|null|<|>/i;
  if (!url.trim() || !key.trim() || placeholder.test(url) || placeholder.test(key)) return false;
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) return false;
  } catch { return false; }
  // Hosted publishable keys are opaque; older anonymous keys use JWT format.
  return /^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key.trim()) || /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key.trim());
}