// ─── CORS PROXY FETCHER WITH FALLBACK ───────────────────────────────────────
// allorigins.win is unreliable. Try it first, then fall back to corsproxy.io.
export async function fetchViaProxy(targetUrl) {
  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
  ];

  let lastError;

  // Try allorigins first (returns JSON wrapper)
  try {
    const res = await fetch(proxies[0], {
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.contents && data.contents.length > 100) return data.contents;
    }
  } catch (e) {
    lastError = e;
  }

  // Fallback: corsproxy.io (returns raw HTML directly)
  try {
    const res = await fetch(proxies[1], {
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const text = await res.text();
      if (text.length > 100) return text;
    }
  } catch (e) {
    lastError = e;
  }

  throw new Error(
    "Could not fetch the landing page. Both proxy servers failed. " +
      "The site may have CORS protection. Try a simpler public page like a Webflow or WordPress site."
  );
}

// ─── HTML CLEANER ───────────────────────────────────────────────────────────
// Strip tags that waste tokens and extract only meaningful body copy.
export function cleanHtmlForAI(html) {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<link[^>]+>/gi, "");

  return stripped.substring(0, 18000);
}

// ─── SPA DETECTOR ──────────────────────────────────────────────────────────
// Detect React/Next.js/Vue apps that serve empty shells via proxy.
export function detectSPA(html) {
  const textOnly = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return textOnly.length < 300;
}

// ─── BASE URL INJECTOR ──────────────────────────────────────────────────────
// When HTML is rendered in a srcdoc iframe, relative URLs resolve against about:srcdoc.
// Inject <base href="..."> to make them resolve against the original domain.
export function injectBaseTag(html, originalUrl) {
  try {
    const { origin } = new URL(originalUrl);
    const baseTag = `<base href="${origin}">`;
    if (html.includes("<head>")) {
      return html.replace("<head>", `<head>${baseTag}`);
    } else if (html.includes("<head ")) {
      return html.replace(/<head[^>]*>/, (match) => `${match}${baseTag}`);
    }
    return baseTag + html;
  } catch {
    return html;
  }
}

// ─── IMAGE TO BASE64 ────────────────────────────────────────────────────────
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function urlToBase64(imageUrl) {
  const proxies = [
    imageUrl, // Try direct first (works for permissive CORS like Unsplash)
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(imageUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`,
  ];

  for (const url of proxies) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const blob = await res.blob();
        const mimeType = blob.type || "image/jpeg";
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        return { base64, mimeType };
      }
    } catch (e) {
      // Ignore error and try the next proxy
      console.warn(`Failed to fetch image from ${url}:`, e);
    }
  }

  throw new Error(
    "Could not fetch image URL. Download the image and upload it instead."
  );
}
