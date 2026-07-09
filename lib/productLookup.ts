/**
 * Looks up a product by barcode (UPC/EAN) via Open Food Facts' free public API.
 * Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
 */
export interface ProductInfo {
  barcode: string;
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  ingredientsText: string | null;
  labelsText: string | null;
  found: boolean;
}

export async function lookupProduct(barcode: string): Promise<ProductInfo> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      barcode
    )}.json`,
    { next: { revalidate: 60 * 60 * 24 } } // cache a day, product data changes rarely
  );

  if (!res.ok) {
    return {
      barcode,
      name: null,
      brand: null,
      imageUrl: null,
      ingredientsText: null,
      labelsText: null,
      found: false,
    };
  }

  const data = await res.json();

  if (data.status !== 1 || !data.product) {
    return {
      barcode,
      name: null,
      brand: null,
      imageUrl: null,
      ingredientsText: null,
      labelsText: null,
      found: false,
    };
  }

  const product = data.product;

  return {
    barcode,
    name: product.product_name || null,
    brand: product.brands || null,
    imageUrl: product.image_front_url || null,
    ingredientsText: product.ingredients_text || null,
    labelsText: product.labels || null,
    found: true,
  };
}
