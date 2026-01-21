const TIMEOUT_MS = 10000;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

// Basic SSRF protection - block localhost and private IPs
const BLOCKED_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fd00:/i,
  /^fe80:/i,
];

function isBlockedHost(hostname: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(hostname));
}

export function validateUrl(urlString: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const url = new URL(urlString);

    // Only allow http and https
    if (!["http:", "https:"].includes(url.protocol)) {
      return { valid: false, error: "Only HTTP and HTTPS URLs are allowed" };
    }

    // Block localhost and private IPs
    if (isBlockedHost(url.hostname)) {
      return {
        valid: false,
        error: "URLs pointing to localhost or private IPs are not allowed",
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

export async function fetchHtml(
  url: string
): Promise<{ html: string; error?: string }> {
  const validation = validateUrl(url);
  if (!validation.valid) {
    return { html: "", error: validation.error };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        html: "",
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      return { html: "", error: "URL does not return HTML content" };
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_SIZE_BYTES) {
      return { html: "", error: "Response too large (max 5MB)" };
    }

    const html = await response.text();

    if (html.length > MAX_SIZE_BYTES) {
      return { html: "", error: "Response too large (max 5MB)" };
    }

    return { html };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return { html: "", error: "Request timed out (10s limit)" };
      }
      return { html: "", error: `Failed to fetch: ${error.message}` };
    }

    return { html: "", error: "Failed to fetch URL" };
  }
}
