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
