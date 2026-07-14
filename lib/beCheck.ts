/**
 * Bioengineered (BE) food detection logic.
 *
 * There is no lab test happening on-device — this is a reference lookup.
 * We classify a product into one of four states based on:
 *   1. An explicit USDA "Bioengineered" or "Derived from Bioengineering" disclosure
 *      (if the source data includes it, e.g. from Open Food Facts labels field).
 *   2. Presence of high-risk BE crop derivatives in the ingredient list.
 *   3. An explicit Non-GMO Project Verified / USDA Organic claim (which legally
 *      excludes BE ingredients).
 *   4. Insufficient data to say either way.
 *
 * This list should be treated as a living document — the USDA updates the
 * official BE List periodically: https://www.ams.usda.gov/rules-regulations/be
 */

export type BEVerdict = "confirmed_be" | "likely_be" | "verified_non_gmo" | "unknown";

export interface BECheckResult {
  verdict: BEVerdict;
  headline: string;
  matchedIngredients: string[];
  explanation: string;
  // Whether we actually had ingredient/label text to evaluate. False means
  // "unknown" is a data gap; true means "unknown" is itself the answer
  // (checked the ingredients, found no BE indicators).
  hasData: boolean;
}

// USDA Bioengineered Food List (high-adoption BE crops), as of the last
// published update. Re-verify against the live list periodically.
export const BE_CROPS = [
  "corn",
  "maize",
  "soy",
  "soybean",
  "canola",
  "rapeseed",
  "sugar beet",
  "alfalfa",
  "cotton",
  "cottonseed",
  "papaya",
  "summer squash",
  "yellow squash",
  "zucchini",
  "potato",
  "apple", // Arctic Apples
  "pink pineapple",
  "aac salmon", // AquAdvantage salmon
];

// Common derivative ingredient names that trace back to a BE crop even when
// the crop name itself isn't printed on the label.
//
// `weak: true` marks derivatives whose source crop can't actually be
// determined from the word alone — plain "sugar" is the clearest case:
// roughly half of US sugar is cane sugar, not sugar beet, and there's no
// way to tell which one a label means from "sugar" by itself. Weak matches
// are surfaced for transparency but never drive a "likely_be" verdict on
// their own; only a strong (unambiguous) match does that.
const BE_DERIVATIVES: Record<string, { source: string; weak?: boolean }> = {
  "corn syrup": { source: "corn" },
  "high fructose corn syrup": { source: "corn" },
  "corn starch": { source: "corn" },
  "cornstarch": { source: "corn" },
  "maltodextrin": { source: "corn" },
  "dextrose": { source: "corn" },
  "citric acid": { source: "corn" }, // often fermented from corn-derived glucose
  "xanthan gum": { source: "corn" },
  "soy lecithin": { source: "soy" },
  "soybean oil": { source: "soy" },
  "textured vegetable protein": { source: "soy" },
  "vegetable oil": { source: "soy/canola/corn (unspecified blend)" },
  "canola oil": { source: "canola" },
  "sugar": { source: "sugar beet (unless cane sugar is specified)", weak: true },
  "cottonseed oil": { source: "cotton" },
};

const NON_GMO_CLAIMS = [
  "non-gmo project verified",
  "non gmo project verified",
  "usda organic",
  "certified organic",
  "non-bioengineered",
];

const BE_DISCLOSURE_PHRASES = [
  "bioengineered food",
  "derived from bioengineering",
  "contains a bioengineered food ingredient",
];

export function checkBioengineered(params: {
  ingredientsText?: string;
  labelsText?: string; // certifications / claims, e.g. from Open Food Facts "labels" field
}): BECheckResult {
  const ingredients = (params.ingredientsText || "").toLowerCase();
  const labels = (params.labelsText || "").toLowerCase();

  if (!ingredients && !labels) {
    return {
      verdict: "unknown",
      headline: "Not enough data",
      matchedIngredients: [],
      explanation:
        "We couldn't find ingredient or label information for this product. Try scanning the barcode again or check the package for a 'Bioengineered' disclosure.",
      hasData: false,
    };
  }

  // 1. Explicit BE disclosure wins — it's a legal claim, not an inference.
  if (BE_DISCLOSURE_PHRASES.some((p) => labels.includes(p))) {
    return {
      verdict: "confirmed_be",
      headline: "Confirmed bioengineered",
      matchedIngredients: [],
      explanation:
        "This product carries an official USDA Bioengineered Food disclosure on its packaging or label data.",
      hasData: true,
    };
  }

  // 2. Explicit non-GMO / organic claim also wins over ingredient guessing.
  if (NON_GMO_CLAIMS.some((c) => labels.includes(c))) {
    return {
      verdict: "verified_non_gmo",
      headline: "Verified non-GMO",
      matchedIngredients: [],
      explanation:
        "This product carries a Non-GMO Project Verified, USDA Organic, or equivalent certification, which excludes bioengineered ingredients.",
      hasData: true,
    };
  }

  // 3. Otherwise, infer risk from ingredient list.
  // Word-boundary matching so e.g. "apple" doesn't match inside "pineapple",
  // and "corn" doesn't match inside "popcorn" unless that's actually intended.
  function containsWholeTerm(haystack: string, term: string): boolean {
    // Escape regex special chars in multi-word terms (e.g. "corn syrup").
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i");
    return pattern.test(haystack);
  }

  const strongMatches = new Set<string>();
  const weakMatches = new Set<string>();

  for (const crop of BE_CROPS) {
    if (containsWholeTerm(ingredients, crop)) strongMatches.add(crop);
  }
  for (const [derivative, info] of Object.entries(BE_DERIVATIVES)) {
    if (containsWholeTerm(ingredients, derivative)) {
      const label = `${derivative} (${info.source})`;
      if (info.weak) {
        weakMatches.add(label);
      } else {
        strongMatches.add(label);
      }
    }
  }

  // A weak match alone (e.g. just "sugar") isn't enough to call a product
  // likely bioengineered — it's ambiguous by itself. Only surface it as
  // supporting context once a strong, unambiguous match is also present.
  if (strongMatches.size > 0) {
    return {
      verdict: "likely_be",
      headline: "Likely contains bioengineered ingredients",
      matchedIngredients: [...Array.from(strongMatches), ...Array.from(weakMatches)],
      explanation:
        "This product lists ingredients commonly derived from crops on the USDA Bioengineered Food List. No official BE disclosure was found, so this is an inference from ingredients, not a confirmed disclosure.",
      hasData: true,
    };
  }

  if (weakMatches.size > 0) {
    return {
      verdict: "unknown",
      headline: "No clear BE indicators found",
      matchedIngredients: Array.from(weakMatches),
      explanation:
        "This product lists ingredients (like plain \"sugar\") whose source crop can't be determined from the label alone — it could be cane sugar or bioengineered sugar beet, and there's no way to tell which from the wording. We didn't find any unambiguous BE indicators, so we can't confidently say either way.",
      hasData: true,
    };
  }

  return {
    verdict: "unknown",
    headline: "No BE indicators found",
    matchedIngredients: [],
    explanation:
      "We didn't find any high-risk BE crop derivatives in the listed ingredients, and no certification was present either. This isn't a guarantee — always check the package for the official disclosure.",
    hasData: true,
  };
}
