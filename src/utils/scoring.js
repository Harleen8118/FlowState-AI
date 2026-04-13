// ─── MESSAGE MATCH SCORE ────────────────────────────────────────────────────
// Runs in JavaScript. No extra API call, zero latency, zero cost.
// Scores how well the landing page copy aligns with the ad creative.
// Returns a 0–100 score broken down by component.

export function calcMessageMatchScore(adInsights, pageText) {
  const text = pageText.toLowerCase();
  let score = 0;
  const breakdown = [];

  // 1. Keyword overlap (0–40 points)
  const keywords = adInsights.keywords || [];
  const matchedKeywords = keywords.filter((kw) =>
    text.includes(kw.toLowerCase())
  );
  const kwScore =
    keywords.length > 0
      ? Math.round((matchedKeywords.length / keywords.length) * 40)
      : 0;
  score += kwScore;
  breakdown.push({
    label: "Keyword Overlap",
    score: kwScore,
    max: 40,
    detail: `${matchedKeywords.length} of ${keywords.length} ad keywords found on page`,
  });

  // 2. CTA alignment (0–20 points)
  const ctaWords = (adInsights.cta || "")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const ctaMatches = ctaWords.filter((w) => text.includes(w));
  const ctaScore =
    ctaWords.length > 0
      ? Math.round((ctaMatches.length / ctaWords.length) * 20)
      : 0;
  score += ctaScore;
  breakdown.push({
    label: "CTA Alignment",
    score: ctaScore,
    max: 20,
    detail:
      ctaScore >= 15
        ? "Page CTA closely matches ad CTA"
        : "Page CTA diverges from ad CTA",
  });

  // 3. Urgency match (0–20 points)
  const urgencyWords = [
    "today",
    "now",
    "limited",
    "hurry",
    "last",
    "expires",
    "only",
    "deadline",
    "offer ends",
  ];
  const hasPageUrgency = urgencyWords.some((w) => text.includes(w));
  const adIsUrgent =
    adInsights.urgencyLevel === "high" ||
    adInsights.urgencyLevel === "medium";
  const urgencyScore =
    adIsUrgent && hasPageUrgency ? 20 : adIsUrgent && !hasPageUrgency ? 0 : 10;
  score += urgencyScore;
  breakdown.push({
    label: "Urgency Match",
    score: urgencyScore,
    max: 20,
    detail: adIsUrgent
      ? hasPageUrgency
        ? "Page reinforces ad urgency"
        : "Ad is urgent but page is not"
      : "Ad has low urgency (neutral)",
  });

  // 4. Benefit/pain point language (0–20 points)
  const benefitWords = (adInsights.keyBenefit || "")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const painWords = (adInsights.painPoint || "")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const benefitMatches = [...benefitWords, ...painWords].filter((w) =>
    text.includes(w)
  );
  const benefitScore =
    benefitWords.length + painWords.length > 0
      ? Math.min(
          20,
          Math.round(
            (benefitMatches.length / (benefitWords.length + painWords.length)) *
              30
          )
        )
      : 10;
  score += benefitScore;
  breakdown.push({
    label: "Benefit Language",
    score: benefitScore,
    max: 20,
    detail:
      benefitMatches.length > 2
        ? "Page addresses ad's benefit/pain point"
        : "Page doesn't mirror ad's value prop",
  });

  return { total: Math.min(100, score), breakdown };
}
