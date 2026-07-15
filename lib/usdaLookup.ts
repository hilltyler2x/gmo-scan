import type { ProductInfo } from "./productLookup";

/**
 * Fallback product lookup via USDA FoodData Central, used when Open Food
 * Facts has no record for a barcode. Docs: https://fdc.nal.usda.gov/api-guide
 *
 * FDC has no image URLs and no organic/Non-GMO Project label tags in its
 * Branded Foods data, so results from here only ever carry ingredient text
 * — they can be inferred as likely_be or unknown, never confirmed_be or
 * verified_non_gmo, since there's no disclosure/certification field to check.
 *
 * Uses the free DEMO_KEY by default (30 requests/hour, 50/day per IP) if
 * USDA_FDC_API_KEY isn't set. Get a free, instant key at
 * https://fdc.nal.usda.gov/api-key-signup.html for real traffic.
 */
export async function lookupUsdaProduct(barcode: string): Promise<ProductInfo> {
  const apiKey = process.env.USDA_FDC_API_KEY || "DEMO_KEY";
  // FDC stores barcodes as 14-digit GTIN (zero-padded), while barcode
  // scanners typically produce 12-digit UPC-A — pad to match.
  const gtin = barcode.padStart(14, "0");

  const notFound: ProductInfo = {
    barcode,
    name: null,
    brand: null,
    imageUrl: null,
    ingredientsText: null,
    labelsText: null,
    found: false,
  };

  const res = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
      gtin
    )}&dataType=Branded&pageSize=1&api_key=${encodeURIComponent(apiKey)}`,
    { next: { revalidate: 60 * 60 * 24 } }
  );

  if (!res.ok) return notFound;

  const data = await res.json();
  const food = data.foods?.[0];

  if (!food) return notFound;

  return {
    barcode,
    name: food.description || null,
    brand: food.brandOwner || food.brandName || null,
    imageUrl: null,
    ingredientsText: food.ingredients || null,
    labelsText: null,
    found: true,
  };
}
