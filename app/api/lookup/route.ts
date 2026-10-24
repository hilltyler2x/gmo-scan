import { NextRequest, NextResponse } from "next/server";
import { lookupProduct } from "@/lib/productLookup";
import { lookupUsdaProduct } from "@/lib/usdaLookup";
import { checkBioengineered } from "@/lib/beCheck";

// The iPhone and Android apps load their pages from these origins and call
// this route on the live site, so the browser needs CORS headers to let them
// read the response. Website requests are same-origin and don't need them.
const APP_ORIGINS = new Set(["capacitor://localhost", "https://localhost", "http://localhost"]);

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin");
  if (!origin || !APP_ORIGINS.has(origin)) return {};
  return { "Access-Control-Allow-Origin": origin, Vary: "Origin" };
}

export async function GET(req: NextRequest) {
  const headers = corsHeaders(req);
  const barcode = req.nextUrl.searchParams.get("barcode");

  if (!barcode) {
    return NextResponse.json(
      { error: "Missing required 'barcode' query param" },
      { status: 400, headers }
    );
  }

  let product = await lookupProduct(barcode);

  // Fall back to USDA FoodData Central when Open Food Facts has no record.
  if (!product.found) {
    product = await lookupUsdaProduct(barcode);
  }

  if (!product.found) {
    return NextResponse.json(
      {
        product,
        beResult: {
          verdict: "unknown",
          headline: "Product not found",
          matchedIngredients: [],
          explanation:
            "This barcode isn't in our product database yet. You can search by name instead, or check the package for a Bioengineered disclosure directly.",
          hasData: false,
        },
      },
      { headers }
    );
  }

  const beResult = checkBioengineered({
    ingredientsText: product.ingredientsText || undefined,
    labelsText: product.labelsText || undefined,
  });

  return NextResponse.json({ product, beResult }, { headers });
}
