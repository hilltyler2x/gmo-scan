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

interface CropEntry {
  term: string; // search term, any language
  label: string; // English display name shown to the user
  // `weak: true` marks crops whose real-world BE-variety adoption is low
  // (a small niche product, not the dominant form on the market) — e.g.
  // Arctic Apples and Innate potatoes are a tiny fraction of apples/potatoes
  // actually sold, unlike corn/soy/canola/cotton/sugar beet which are
  // 85%+ bioengineered in the US. Weak crops alone don't drive a
  // "likely_be" verdict, same treatment as ambiguous derivatives below.
  weak?: boolean;
}

// USDA Bioengineered Food List (high-adoption BE crops), as of the last
// published update, plus common non-English search terms for the same
// crops. Re-verify against the live list periodically:
// https://www.ams.usda.gov/rules-regulations/be
export const BE_CROPS: CropEntry[] = [
  { term: "corn", label: "corn" },
  { term: "maize", label: "corn" },
  { term: "maïs", label: "corn" }, // French
  { term: "maíz", label: "corn" }, // Spanish
  { term: "mais", label: "corn" }, // German
  { term: "soy", label: "soy" },
  { term: "soja", label: "soy" }, // French / German / Spanish / Portuguese / Italian
  { term: "soya", label: "soy" }, // Spanish variant
  { term: "soybean", label: "soybean" },
  { term: "canola", label: "canola" },
  { term: "rapeseed", label: "rapeseed" },
  { term: "colza", label: "canola/rapeseed" }, // French / Spanish / German umbrella term
  { term: "sugar beet", label: "sugar beet" },
  { term: "betterave sucrière", label: "sugar beet" }, // French
  { term: "remolacha azucarera", label: "sugar beet" }, // Spanish
  { term: "zuckerrübe", label: "sugar beet" }, // German
  { term: "alfalfa", label: "alfalfa" },
  { term: "cotton", label: "cotton" },
  { term: "coton", label: "cotton" }, // French
  { term: "algodón", label: "cotton" }, // Spanish
  { term: "baumwolle", label: "cotton" }, // German
  { term: "cottonseed", label: "cottonseed" },
  { term: "papaya", label: "papaya" },
  { term: "summer squash", label: "summer squash" },
  { term: "yellow squash", label: "yellow squash" },
  { term: "zucchini", label: "zucchini" },
  { term: "courgette", label: "zucchini" }, // French / British English
  // Arctic Apples and Innate potatoes are real BE-listed crops, but a
  // small niche of the actual apple/potato market — see `weak` above.
  { term: "potato", label: "potato", weak: true },
  { term: "pomme de terre", label: "potato", weak: true }, // French
  { term: "patata", label: "potato", weak: true }, // Spanish / Italian
  { term: "kartoffel", label: "potato", weak: true }, // German
  { term: "apple", label: "apple", weak: true }, // Arctic Apples
  { term: "pomme", label: "apple", weak: true }, // French
  { term: "manzana", label: "apple", weak: true }, // Spanish
  { term: "apfel", label: "apple", weak: true }, // German
  { term: "pink pineapple", label: "pink pineapple" },
  { term: "aac salmon", label: "aac salmon" }, // AquAdvantage salmon
];

interface DerivativeEntry {
  term: string; // search term, any language
  label: string; // English display name shown to the user
  source: string;
  // See CropEntry.weak — same idea, but for derivative ingredient names
  // whose source crop genuinely can't be determined from the word alone
  // (plain "sugar" could be cane or beet; generic "vegetable oil" or
  // "modified starch" could come from several different crops).
  weak?: boolean;
}

// Common derivative ingredient names that trace back to a BE crop even when
// the crop name itself isn't printed on the label, plus non-English
// equivalents for the highest-value (highest-adoption) crops.
const BE_DERIVATIVES: DerivativeEntry[] = [
  { term: "corn syrup", label: "corn syrup", source: "corn" },
  { term: "high fructose corn syrup", label: "corn syrup", source: "corn" },
  { term: "corn starch", label: "corn starch", source: "corn" },
  { term: "cornstarch", label: "corn starch", source: "corn" },
  { term: "amidon de maïs", label: "corn starch", source: "corn" }, // French
  { term: "almidón de maíz", label: "corn starch", source: "corn" }, // Spanish
  { term: "maisstärke", label: "corn starch", source: "corn" }, // German
  { term: "maltodextrin", label: "maltodextrin", source: "corn" },
  { term: "dextrose", label: "dextrose", source: "corn" },
  { term: "citric acid", label: "citric acid", source: "corn" }, // often fermented from corn-derived glucose
  { term: "xanthan gum", label: "xanthan gum", source: "corn" },
  { term: "soy lecithin", label: "soy lecithin", source: "soy" },
  { term: "lécithine de soja", label: "soy lecithin", source: "soy" }, // French
  { term: "lecitina de soja", label: "soy lecithin", source: "soy" }, // Spanish
  { term: "sojalecithin", label: "soy lecithin", source: "soy" }, // German
  { term: "soybean oil", label: "soybean oil", source: "soy" },
  { term: "huile de soja", label: "soybean oil", source: "soy" }, // French
  { term: "textured vegetable protein", label: "textured vegetable protein", source: "soy" },
  { term: "canola oil", label: "canola oil", source: "canola" },
  { term: "huile de colza", label: "canola/rapeseed oil", source: "canola/rapeseed" }, // French
  { term: "rapsöl", label: "canola/rapeseed oil", source: "canola/rapeseed" }, // German
  { term: "cottonseed oil", label: "cottonseed oil", source: "cotton" },
  // Fixes a real gap: labels sometimes say "beet sugar" (reversed word
  // order from the "sugar beet" crop name), which wouldn't otherwise match.
  // Unlike plain "sugar" below, this phrasing is unambiguous.
  { term: "beet sugar", label: "beet sugar", source: "sugar beet" },
  {
    term: "vegetable oil",
    label: "vegetable oil",
    source: "soy/canola/corn (unspecified blend)",
    weak: true,
  },
  {
    term: "huile végétale",
    label: "vegetable oil",
    source: "soy/canola/corn (unspecified blend)",
    weak: true,
  }, // French
  {
    term: "aceite vegetal",
    label: "vegetable oil",
    source: "soy/canola/corn (unspecified blend)",
    weak: true,
  }, // Spanish
  {
    term: "pflanzenöl",
    label: "vegetable oil",
    source: "soy/canola/corn (unspecified blend)",
    weak: true,
  }, // German
  {
    term: "sugar",
    label: "sugar",
    source: "sugar beet (unless cane sugar is specified)",
    weak: true,
  },
  {
    term: "sucre",
    label: "sugar",
    source: "sugar beet (unless cane sugar is specified)",
    weak: true,
  }, // French
  {
    term: "azúcar",
    label: "sugar",
    source: "sugar beet (unless cane sugar is specified)",
    weak: true,
  }, // Spanish
  {
    term: "zucker",
    label: "sugar",
    source: "sugar beet (unless cane sugar is specified)",
    weak: true,
  }, // German
  {
    term: "modified food starch",
    label: "modified food starch",
    source: "corn/potato/tapioca (unspecified)",
    weak: true,
  },
  {
    term: "modified starch",
    label: "modified starch",
    source: "corn/potato/tapioca (unspecified)",
    weak: true,
  },
  {
    term: "glucose syrup",
    label: "glucose syrup",
    source: "corn/wheat/potato (unspecified)",
    weak: true,
  },
  {
    term: "lecithin",
    label: "lecithin",
    source: "soy/sunflower (unspecified)",
    weak: true,
  },
];

const NON_GMO_CLAIMS = [
  "non-gmo project verified",
  "non gmo project verified",
  "usda organic",
  "certified organic",
  // Open Food Facts frequently normalizes organic certifications down to a
  // plain "Organic" label tag rather than "USDA Organic"/"Certified Organic"
  // verbatim. Any genuine organic certification legally excludes
  // bioengineered ingredients, so the bare word counts too.
  "organic",
  "non-bioengineered",
  "no gmos",
  "no gmo",
];

const BE_DISCLOSURE_PHRASES = [
  "bioengineered food",
  "derived from bioengineering",
  "contains a bioengineered food ingredient",
  // Open Food Facts' own community label tag, distinct from the USDA's
  // exact statutory wording above but just as much a disclosure.
  "contains gmos",
  "contains gmo",
];

// Word-boundary matching so e.g. "apple" doesn't match inside "pineapple",
// "corn" doesn't match inside "popcorn", and "organic" doesn't match inside
// some unrelated compound word, unless that's actually intended. Also allows
// a trailing "s"/"es" so plurals match too (e.g. "vegetable oils", "potatoes")
// — real ingredient lists say both "vegetable oil" and "vegetable oils".
function containsWholeTerm(haystack: string, term: string): boolean {
  // Escape regex special chars in multi-word terms (e.g. "corn syrup").
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?<![a-z])${escaped}(e?s)?(?![a-z])`, "i");
  return pattern.test(haystack);
}

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
  // Open Food Facts' labelsText is a structured tag field, not free-text
  // prose, and tags are sometimes concatenated with no separator between
  // them (e.g. "...glutenNo GMOsOrthodox..."). Word-boundary matching would
  // miss those real cases, so we use plain substring matching here instead
  // — the phrases themselves are distinctive multi-word strings unlikely to
  // collide accidentally, unlike single crop names in free-text ingredient
  // lists (where word-boundary matching earns its keep).
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
  // Same reasoning as above: plain substring matching for this structured,
  // tag-like field.
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
  const strongMatches = new Set<string>();
  const weakMatches = new Set<string>();

  for (const crop of BE_CROPS) {
    if (containsWholeTerm(ingredients, crop.term)) {
      if (crop.weak) {
        weakMatches.add(crop.label);
      } else {
        strongMatches.add(crop.label);
      }
    }
  }
  for (const derivative of BE_DERIVATIVES) {
    if (containsWholeTerm(ingredients, derivative.term)) {
      const label = `${derivative.label} (${derivative.source})`;
      if (derivative.weak) {
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
        "This product lists ingredients whose source crop can't be determined from the label alone (e.g. plain sugar could be cane or bioengineered sugar beet, and generic vegetable oil or starch could come from several different crops). We didn't find any unambiguous BE indicators, so we can't confidently say either way.",
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
