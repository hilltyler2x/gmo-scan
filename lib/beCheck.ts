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
const BE_DERIVATIVES: Record<string, string> = {
  "corn syrup": "corn",
  "high fructose corn syrup": "corn",
  "corn starch": "corn",
  "cornstarch": "corn",
  "maltodextrin": "corn",
  "dextrose": "corn",
  "citric acid": "corn", // often fermented from corn-derived glucose
  "xanthan gum": "corn",
  "soy lecithin": "soy",
  "soybean oil": "soy",
  "textured vegetable protein": "soy",
  "vegetable oil": "soy/canola/corn (unspecified blend)",
  "canola oil": "canola",
  "sugar": "sugar beet (unless cane sugar is specified)",
  "cottonseed oil": "cotton",
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
    };
  }

  // 3. Otherwise, infer risk from ingredient list.
  const matched = new Set<string>();

  for (const crop of BE_CROPS) {
    if (ingredients.includes(crop)) matched.add(crop);
  }
  for (const [derivative, source] of Object.entries(BE_DERIVATIVES)) {
    if (ingredients.includes(derivative)) matched.add(`${derivative} (${source})`);
  }

  if (matched.size > 0) {
    return {
      verdict: "likely_be",
      headline: "Likely contains bioengineered ingredients",
      matchedIngredients: Array.from(matched),
      explanation:
        "This product lists ingredients commonly derived from crops on the USDA Bioengineered Food List. No official BE disclosure was found, so this is an inference from ingredients, not a confirmed disclosure.",
    };
  }

  return {
    verdict: "unknown",
    headline: "No BE indicators found",
    matchedIngredients: [],
    explanation:
      "We didn't find any high-risk BE crop derivatives in the listed ingredients, and no certification was present either. This isn't a guarantee — always check the package for the official disclosure.",
  };
}
