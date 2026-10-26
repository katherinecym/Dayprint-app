/**
 * Normalizes however a user pasted a GitHub repo reference into `owner/name`.
 *
 * Accepts the shapes people actually type:
 *   `https://github.com/alex/dayprint`
 *   `github.com/alex/dayprint.git`
 *   `alex/dayprint`
 *   `/alex/dayprint/`
 *
 * Was duplicated verbatim in `WelcomeGatewayModal.tsx` and
 * `GitHubSettingsModal.tsx`. Two copies of a URL parser is a standing invitation
 * for the onboarding flow and the settings flow to disagree about which repo the
 * user is connected to, which is exactly the class of bug that is impossible to
 * reproduce from a bug report.
 */

export function normalizeGitHubRepo(input: string): string {
  if (!input) return "";
  let cleaned = input.trim();
  cleaned = cleaned.replace(/^https?:\/\//i, "");
  cleaned = cleaned.replace(/^github\.com\//i, "");
  cleaned = cleaned.replace(/\.git$/i, "");
  cleaned = cleaned.replace(/^\/+|\/+$/g, "");
  return cleaned;
}

/** True when the value looks like a usable `owner/name` pair. */
export function isValidGitHubRepo(input: string): boolean {
  return /^[\w.-]+\/[\w.-]+$/.test(normalizeGitHubRepo(input));
}
