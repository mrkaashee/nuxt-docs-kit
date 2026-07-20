/**
 * Converts a same-origin absolute URL to a root-relative path.
 */
export function normalizeImageUrl(url: string, appOrigin: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.origin === appOrigin) {
      return parsed.pathname + parsed.search + parsed.hash
    }
    return url
  } catch {
    return url
  }
}
