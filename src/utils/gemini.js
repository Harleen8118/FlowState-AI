// ─── GEMINI API HELPER ──────────────────────────────────────────────────────
// Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}
// Body: { contents: [{ parts: [{ text: "..." }, { inline_data: { mime_type, data } }] }] }
// Response: data.candidates[0].content.parts[0].text

export async function callGemini(apiKey, parts, maxOutputTokens = 8192) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        maxOutputTokens,
        temperature: 0.7,
      },
    }),
  });

  // Handle rate limiting - Gemini free tier is 15 RPM
  if (res.status === 429) {
    throw new Error(
      "Rate limit hit (Gemini free tier: 15 requests/min). Wait 30 seconds and try again."
    );
  }

  if (!res.ok) {
    let errMsg = `Gemini API error ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData.error?.message || errMsg;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errMsg);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

// ─── STEP A: Analyze ad creative with Gemini Vision ─────────────────────────
export async function analyzeAd(apiKey, imageBase64, imageMimeType) {
  const parts = [
    {
      inline_data: { mime_type: imageMimeType, data: imageBase64 },
    },
    {
      text: `Analyze this ad creative. Return ONLY a valid JSON object. No markdown, no explanation, no code fences. Just raw JSON.

{
  "headline": "main headline or key message from the ad",
  "subheadline": "secondary message if present, else empty string",
  "cta": "call-to-action button text from the ad",
  "tone": "one of: urgent, professional, playful, aspirational, fear-based, value-driven",
  "targetAudience": "who this ad speaks to, inferred from visuals and copy",
  "keyBenefit": "primary value proposition offered",
  "painPoint": "the problem this ad addresses",
  "offerDetails": "any discount, trial, or specific offer mentioned",
  "urgencyLevel": "low, medium, or high",
  "socialProofHints": "any testimonials, ratings, or user counts shown",
  "keywords": ["5 to 8 power words", "from the ad copy", "that carry the message"]
}`,
    },
  ];

  const raw = await callGemini(apiKey, parts, 1000);
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini returned malformed ad analysis JSON. Try again.");
  }
}

// ─── STEP B: Personalize the landing page ──────────────────────────────────
export async function personalizePage(apiKey, cleanedHtml, adInsights) {
  const parts = [
    {
      text: `You are an expert CRO (Conversion Rate Optimization) specialist and frontend developer.
Your task: take existing landing page HTML and make SURGICAL modifications to match the ad creative that brought the user there.

AD CREATIVE ANALYSIS:
${JSON.stringify(adInsights, null, 2)}

ORIGINAL PAGE HTML (cleaned, stripped of scripts/nav/footer):
${cleanedHtml}

STRICT RULES - READ CAREFULLY:
1. Return ONLY the modified HTML. Zero explanation, zero markdown, zero commentary before or after.
2. Do NOT rewrite the entire page. Make targeted changes only.
3. Do NOT change layouts, class names, IDs, or structural elements.
4. You MAY modify: h1/h2/h3 text, paragraph copy in the hero section, CTA button text, meta description.
5. You MAY add: a small urgency banner at the very top (if urgencyLevel is high/medium), one inline social proof sentence near the CTA.
6. Keep all external resource references unchanged (src, href attributes on scripts/images/links).
7. For any element you add, use only inline styles, never external class names.
8. The output must be valid HTML that a browser can render.

CRO PRINCIPLES TO APPLY:
- MESSAGE MATCH: Hero headline should echo the ad's headline so users feel continuity of the journey
- CTA SCENT: Primary CTA text should match or directly complement the ad's call-to-action
- BENEFIT-FIRST COPY: Rewrite the hero paragraph to lead with the key benefit, not a feature list
- PAIN ACKNOWLEDGMENT: If there is a problem/solution section, align it to the ad's pain point
- URGENCY (only if urgencyLevel is high or medium): Add a small top banner like a strip with the offer details
- SOCIAL PROOF AMPLIFICATION: If the ad mentions social proof hints, add a brief trust line near the primary CTA

Return the complete, browser-renderable HTML.`,
    },
  ];

  return await callGemini(apiKey, parts, 8192);
}
