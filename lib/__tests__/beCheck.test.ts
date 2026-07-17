import { test } from "node:test";
import assert from "node:assert/strict";
import { checkBioengineered } from "../beCheck";

test("no ingredient or label text returns unknown with hasData false", () => {
  const result = checkBioengineered({});
  assert.equal(result.verdict, "unknown");
  assert.equal(result.hasData, false);
});

test("explicit BE disclosure phrase returns confirmed_be", () => {
  const result = checkBioengineered({
    labelsText: "Contains a bioengineered food ingredient",
  });
  assert.equal(result.verdict, "confirmed_be");
  assert.equal(result.hasData, true);
});

test("Open Food Facts 'Contains GMOs' label tag returns confirmed_be", () => {
  const result = checkBioengineered({
    labelsText: "Contains GMOs, Orthodox Union Kosher",
  });
  assert.equal(result.verdict, "confirmed_be");
  assert.equal(result.hasData, true);
});

test("Open Food Facts bare 'Organic' label tag returns verified_non_gmo, even with a BE-crop ingredient present", () => {
  // Real case: Annie's Shells & Real Aged Cheddar has labelsText "Organic,
  // No artificial flavors, ..." (not the exact phrase "USDA Organic") and
  // its ingredients include Corn Starch. Since the product is genuinely
  // organic-certified, that legally excludes BE ingredients regardless of
  // what's in the ingredient list.
  const result = checkBioengineered({
    ingredientsText: "Organic pasta, dried cheddar cheese, corn starch, salt",
    labelsText: "Organic, No artificial flavors",
  });
  assert.equal(result.verdict, "verified_non_gmo");
});

test("non-GMO / organic claim returns verified_non_gmo", () => {
  const result = checkBioengineered({ labelsText: "USDA Organic" });
  assert.equal(result.verdict, "verified_non_gmo");
  assert.equal(result.hasData, true);
});

test("BE disclosure wins over a non-GMO claim present in the same label text", () => {
  const result = checkBioengineered({
    labelsText: "USDA Organic, Bioengineered Food",
  });
  assert.equal(result.verdict, "confirmed_be");
});

test("ingredient list containing a BE crop returns likely_be", () => {
  const result = checkBioengineered({ ingredientsText: "corn, salt, water" });
  assert.equal(result.verdict, "likely_be");
  assert.equal(result.hasData, true);
  assert.ok(result.matchedIngredients.includes("corn"));
});

test("ingredient list containing a BE derivative returns likely_be with source noted", () => {
  const result = checkBioengineered({
    ingredientsText: "corn syrup, salt, water",
  });
  assert.equal(result.verdict, "likely_be");
  assert.ok(
    result.matchedIngredients.some((i) => i.startsWith("corn syrup"))
  );
});

test("ingredient list with no BE indicators returns unknown with hasData true", () => {
  const result = checkBioengineered({
    ingredientsText: "orange juice, ginger, turmeric, himalayan pink salt",
  });
  assert.equal(result.verdict, "unknown");
  assert.equal(result.hasData, true);
  assert.equal(result.matchedIngredients.length, 0);
});

test("word-boundary matching: 'apple' does not match inside 'pineapple'", () => {
  const result = checkBioengineered({
    ingredientsText: "pineapple juice, water, sugar",
  });
  assert.ok(!result.matchedIngredients.some((i) => i.startsWith("apple")));
});

test("word-boundary matching: 'corn' does not match inside 'popcorn'", () => {
  const result = checkBioengineered({ ingredientsText: "popcorn, salt" });
  assert.equal(result.matchedIngredients.length, 0);
});

test("word-boundary matching: whole-word 'apple' still matches on its own", () => {
  const result = checkBioengineered({
    ingredientsText: "apple juice, water",
  });
  assert.ok(result.matchedIngredients.includes("apple"));
});

test("word-boundary matching: multi-word derivative term still matches correctly", () => {
  const result = checkBioengineered({
    ingredientsText: "high fructose corn syrup, water",
  });
  assert.ok(
    result.matchedIngredients.some((i) => i.startsWith("corn syrup"))
  );
});

test("plain 'sugar' alone (ambiguous cane vs. beet) does not trigger likely_be", () => {
  const result = checkBioengineered({
    ingredientsText: "orange juice, ginger, sugar, salt",
  });
  assert.equal(result.verdict, "unknown");
  assert.equal(result.hasData, true);
  assert.ok(result.matchedIngredients.some((i) => i.startsWith("sugar")));
});

test("plain 'sugar' plus a strong match still reaches likely_be, including sugar as context", () => {
  const result = checkBioengineered({
    ingredientsText: "canola oil, sugar, salt",
  });
  assert.equal(result.verdict, "likely_be");
  assert.ok(result.matchedIngredients.some((i) => i.startsWith("canola")));
  assert.ok(result.matchedIngredients.some((i) => i.startsWith("sugar")));
});

test("plain 'vegetable oil' alone (ambiguous soy/canola/corn blend) does not trigger likely_be", () => {
  const result = checkBioengineered({
    ingredientsText: "water, vegetable oil, salt",
  });
  assert.equal(result.verdict, "unknown");
  assert.equal(result.hasData, true);
  assert.ok(
    result.matchedIngredients.some((i) => i.startsWith("vegetable oil"))
  );
});

test("plain 'vegetable oil' plus a strong match still reaches likely_be", () => {
  const result = checkBioengineered({
    ingredientsText: "corn syrup, vegetable oil, salt",
  });
  assert.equal(result.verdict, "likely_be");
  assert.ok(result.matchedIngredients.some((i) => i.startsWith("corn syrup")));
  assert.ok(
    result.matchedIngredients.some((i) => i.startsWith("vegetable oil"))
  );
});

test("plural forms match too: 'rapeseed' matches inside real Jif ingredient text with 'vegetable oils'", () => {
  // Real case: Jif Creamy Peanut Butter lists "fully hydrogenated vegetable
  // oils (rapeseed and soybean)" - plural "oils", and rapeseed/soybean named
  // directly. All three should be caught as strong matches.
  const result = checkBioengineered({
    ingredientsText:
      "roasted peanuts, sugar, molasses, fully hydrogenated vegetable oils (rapeseed and soybean), mono and diglycerides, salt",
  });
  assert.equal(result.verdict, "likely_be");
  assert.ok(result.matchedIngredients.includes("rapeseed"));
  assert.ok(result.matchedIngredients.includes("soybean"));
});

test("plural forms match: 'potatoes' matches the 'potato' crop entry", () => {
  const result = checkBioengineered({
    ingredientsText: "dried potatoes, salt, oil",
  });
  assert.ok(result.matchedIngredients.includes("potato"));
});

test("plural word-boundary still holds: 'corns' does not match inside 'unicorns'", () => {
  const result = checkBioengineered({ ingredientsText: "unicorns, salt" });
  assert.equal(result.matchedIngredients.length, 0);
});

test("Open Food Facts 'No GMOs' label claim returns verified_non_gmo, even with a BE-crop ingredient present", () => {
  // Real case: a Jif Creamy Peanut Butter variant has labelsText containing
  // "No GMOs" alongside rapeseed/soybean oils in the ingredients.
  const result = checkBioengineered({
    ingredientsText:
      "roasted peanuts, sugar, molasses, fully hydrogenated vegetable oils (rapeseed and soybean), salt",
    labelsText: "No gluten, KosherNo glutenNo GMOsOrthodox Union Kosher",
  });
  assert.equal(result.verdict, "verified_non_gmo");
});

test("'potato' alone is weak (niche BE-variety adoption) and doesn't drive likely_be by itself", () => {
  const result = checkBioengineered({ ingredientsText: "potato, salt, oil" });
  assert.equal(result.verdict, "unknown");
  assert.ok(result.matchedIngredients.includes("potato"));
});

test("'apple' alone is weak (niche BE-variety adoption) and doesn't drive likely_be by itself", () => {
  const result = checkBioengineered({ ingredientsText: "apple, cinnamon" });
  assert.equal(result.verdict, "unknown");
  assert.ok(result.matchedIngredients.includes("apple"));
});

test("'beet sugar' (reversed word order from 'sugar beet') is an unambiguous strong match", () => {
  const result = checkBioengineered({
    ingredientsText: "water, beet sugar, salt",
  });
  assert.equal(result.verdict, "likely_be");
  assert.ok(result.matchedIngredients.some((i) => i.startsWith("beet sugar")));
});

test("'modified food starch' and 'glucose syrup' are weak (ambiguous source crop)", () => {
  const result = checkBioengineered({
    ingredientsText: "water, modified food starch, glucose syrup, salt",
  });
  assert.equal(result.verdict, "unknown");
  assert.ok(
    result.matchedIngredients.some((i) => i.startsWith("modified food starch"))
  );
  assert.ok(result.matchedIngredients.some((i) => i.startsWith("glucose syrup")));
});

test("real French ingredient text (Nutella) is now caught via 'SOJA' matching the soy crop term", () => {
  // Real case from this session: Nutella's Open Food Facts entry is in
  // French. Before non-English matching, this returned "no BE indicators
  // found" - a false negative, since "SOJA" (soy) never matched anything.
  const result = checkBioengineered({
    ingredientsText:
      "Sucre, huile de palme, NOISETTES 13%, cacao maigre 7,4%, LAIT écrémé en poudre 6,6%, LACTOSERUM en poudre, émulsifiants: lécithines [SOJA), vanilline. Sans gluten.",
  });
  assert.equal(result.verdict, "likely_be");
  assert.ok(result.matchedIngredients.includes("soy"));
});

test("real German ingredient text (Snickers) is caught via 'Sojalecithin' and 'Zucker'", () => {
  // Real case from this session: a German Snickers entry lists "Zucker"
  // (sugar) and "Sojalecithin" (soy lecithin, German compound word with no
  // space) rather than English terms.
  const result = checkBioengineered({
    ingredientsText:
      "Zucker, Glukosesirup, Erdnüsse, Magermilchpulver, Kakaobutter, Kakaomasse, Molkepermeat (Milch), Sonnenblumenöl, Butterreinfett (Milch), Palmfett, Salz, Emulgator (Sojalecithin), Hühnerei-Trockeneiweiss.",
  });
  assert.equal(result.verdict, "likely_be");
  assert.ok(
    result.matchedIngredients.some((i) => i.startsWith("soy lecithin"))
  );
});

test("Spanish ingredient terms match: 'maíz' (corn) and 'azúcar' (sugar)", () => {
  const result = checkBioengineered({
    ingredientsText: "agua, maíz, azúcar, sal",
  });
  assert.equal(result.verdict, "likely_be");
  assert.ok(result.matchedIngredients.includes("corn"));
});

test("an ingredient explicitly qualified as 'Organic' isn't counted as a BE indicator", () => {
  const result = checkBioengineered({
    ingredientsText: "organic soybean oil, water, salt",
  });
  assert.equal(result.verdict, "unknown");
  assert.equal(result.matchedIngredients.length, 0);
});

test("'organic' exemption applies per-occurrence: a non-organic instance of the same crop still counts", () => {
  const result = checkBioengineered({
    ingredientsText: "organic corn flour, water, soybean oil, salt",
  });
  assert.equal(result.verdict, "likely_be");
  assert.ok(result.matchedIngredients.includes("soybean"));
});

test("'cane sugar' is unambiguously not sugar-beet derived and isn't flagged", () => {
  const result = checkBioengineered({
    ingredientsText: "water, cane sugar, salt",
  });
  assert.equal(result.verdict, "unknown");
  assert.equal(result.matchedIngredients.length, 0);
});

test("real case: Annie's Organic Bunnies Crackers (all flagged ingredients are organic-qualified) is not likely_be", () => {
  // Real case from this session, via the USDA FoodData Central fallback:
  // every BE-crop-adjacent ingredient here is explicitly "Organic X" or
  // "Organic Cane Sugar" - genuinely organic-certified ingredients can't
  // legally be bioengineered, regardless of blanket product-level labeling
  // (which FDC doesn't even provide, unlike Open Food Facts).
  const result = checkBioengineered({
    ingredientsText:
      "Organic Wheat Flour, Organic Expeller-Pressed Sunflower Oil, Organic Cheddar Cheese Paste (organic cheddar cheese [organic milk, cultures, salt, enzymes], organic nonfat dry milk, sea salt), Organic Nonfat Milk, Sea Salt, Salt, Organic Sour Cream (organic nonfat dry milk, organic cultured cream), Organic Paprika, Dried Yeast, Organic Cheddar Cheese (pasteurized milk, cheese cultures, salt, enzyme), Organic Whey, Organic Onion Powder, Monocalcium Phosphate, Baking Soda, Organic Yeast, Organic Coconut Oil, Organic Cane Sugar, Organic Maltodextrin, Organic Soybean Oil, Lactic Acid, Natural Flavors.",
  });
  assert.notEqual(result.verdict, "likely_be");
});
