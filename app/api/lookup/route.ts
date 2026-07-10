import { NextRequest, NextResponse } from "next/server";
import { lookupProduct } from "@/lib/productLookup";
import { checkBioengineered } from "@/lib/beCheck";

export async function GET(req: NextRequest) {
  const barcode = req.nextUrl.searchParams.get("barcode");

  if (!barcode) {
    return NextResponse.json(
      { error: "Missing required 'barcode' query param" },
      { status: 400 }
    );
  }

  const product = await lookupProduct(barcode);

  if (!product.found) {
    return NextResponse.json({
      product,
      beResult: {
        verdict: "unknown",
        headline: "Product not found",
        matchedIngredients: [],
        explanation:
          "This barcode isn't in our product database yet. You can search by name instead, or check the package for a Bioengineered disclosure directly.",
        hasData: false,
      },
    });
  }

  const beResult = checkBioengineered({
    ingredientsText: product.ingredientsText || undefined,
    labelsText: product.labelsText || undefined,
  });

  return NextResponse.json({ product, beResult });
}
