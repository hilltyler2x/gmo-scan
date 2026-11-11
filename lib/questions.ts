/**
 * Plain-language answers to the questions people ask search engines and AI
 * assistants (ChatGPT, Perplexity, Google's AI answers) about GMOs and food
 * labels. Each one becomes a page at /questions/<slug>.
 *
 * Every page opens with a short, direct answer, because that first paragraph
 * is what search engines and AI assistants quote. Keep facts checkable and
 * link the source; keep claims about GMO Scan in step with lib/beCheck.ts.
 * Add a question here and its page, the index and the sitemap all pick it up.
 */

export type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "list"; items: string[] };

export interface Question {
  slug: string;
  question: string;
  // One or two sentences that fully answer the question on their own.
  answer: string;
  body: Block[];
  sources?: { label: string; url: string }[];
  related: string[];
}

const USDA_BE = {
  label: "USDA AMS: National Bioengineered Food Disclosure Standard",
  url: "https://www.ams.usda.gov/rules-regulations/be",
};
const USDA_BE_LIST = {
  label: "USDA AMS: List of Bioengineered Foods",
  url: "https://www.ams.usda.gov/rules-regulations/be/bioengineered-foods-list",
};
const USDA_ERS = {
  label: "USDA ERS: Adoption of Genetically Engineered Crops in the United States",
  url: "https://www.ers.usda.gov/data-products/adoption-of-genetically-engineered-crops-in-the-united-states",
};
const USDA_ORGANIC_GMO = {
  label: "USDA: Can GMOs be used in organic products?",
  url: "https://www.usda.gov/media/blog/2013/05/17/organic-101-can-gmos-be-used-organic-products",
};
const NON_GMO_PROJECT = {
  label: "Non-GMO Project: Product Verification",
  url: "https://www.nongmoproject.org/product-verification/",
};

const HOW_GMO_SCAN_WORKS =
  "GMO Scan looks up the barcode in Open Food Facts, a free public food database, then checks four things in order: an official USDA bioengineered disclosure in the label data, a Non-GMO Project Verified or USDA Organic claim, ingredients made from bioengineered crops on the USDA list, and, if none of that is available, it says it does not know rather than guessing.";

export const QUESTIONS: Question[] = [
  {
    slug: "how-to-tell-if-food-is-gmo",
    question: "How can I tell if a food is GMO?",
    answer:
      "In the US, check the package for the USDA \"Bioengineered\" or \"Derived from Bioengineering\" wording or symbol, or a QR code or phone number for food information. If there is none, look for USDA Organic or Non-GMO Project Verified seals, and read the ingredients for corn, soy, canola, cottonseed or beet sugar, which are usually grown from bioengineered seed in the US.",
    body: [
      { type: "h2", text: "1. Look for the bioengineered disclosure" },
      {
        type: "p",
        text: "Since January 1, 2022, US food makers must disclose bioengineered (BE) foods under the National Bioengineered Food Disclosure Standard. The disclosure can be printed text, the round green USDA symbol, a QR code you scan for details, or a phone number you text.",
      },
      { type: "h2", text: "2. Look for a non-GMO certification" },
      {
        type: "p",
        text: "USDA Organic rules do not allow genetic engineering, and the Non-GMO Project Verified butterfly means the product passed that program's testing and traceability standard.",
      },
      { type: "h2", text: "3. Read the ingredient list" },
      {
        type: "p",
        text: "No disclosure does not always mean no GMOs. Highly refined ingredients such as soybean oil, corn syrup and beet sugar often do not need a label, yet they usually come from bioengineered crops. Watch for:",
      },
      {
        type: "list",
        items: [
          "Corn: corn syrup, high-fructose corn syrup, corn starch, corn oil, dextrose, maltodextrin",
          "Soy: soybean oil, soy lecithin, soy protein",
          "Canola oil and cottonseed oil",
          "\"Sugar\" that is not labeled cane sugar, since much US sugar comes from sugar beets",
        ],
      },
      { type: "h2", text: "4. Or scan the barcode" },
      { type: "p", text: `GMO Scan does these checks for you from a barcode. ${HOW_GMO_SCAN_WORKS}` },
    ],
    sources: [USDA_BE, USDA_BE_LIST],
    related: ["app-that-scans-barcodes-for-gmos", "hidden-gmo-ingredients", "why-no-bioengineered-label"],
  },
  {
    slug: "app-that-scans-barcodes-for-gmos",
    question: "Is there an app that scans barcodes to check for GMOs?",
    answer:
      "Yes. GMO Scan is a web app that checks whether a packaged food is bioengineered (GMO) from its barcode. Point your phone camera at the barcode and it answers yes, no, or unknown, and shows which ingredients triggered the answer.",
    body: [
      { type: "h2", text: "How GMO Scan answers" },
      { type: "p", text: HOW_GMO_SCAN_WORKS },
      {
        type: "list",
        items: [
          "YES, official disclosure: the label data carries a USDA bioengineered disclosure.",
          "YES, inferred: the ingredients include crops that are mostly bioengineered in the US, such as corn, soy, canola or beet sugar.",
          "NO: the product is USDA Organic or Non-GMO Project Verified, or its ingredients contain nothing from the BE list.",
          "UNKNOWN: there is not enough data about the product to say.",
        ],
      },
      { type: "h2", text: "When the barcode is not in the database" },
      {
        type: "p",
        text: "You can photograph the ingredient list or type it in, and GMO Scan checks the ingredients directly. The photo is read on your phone and is not uploaded.",
      },
      { type: "h2", text: "Other places to check" },
      {
        type: "p",
        text: "The Non-GMO Project publishes a shopping guide of products it has verified, and Open Food Facts lets anyone look up a product's ingredients and labels. GMO Scan is built for a quick in-store answer on any product, verified or not.",
      },
    ],
    sources: [USDA_BE, NON_GMO_PROJECT],
    related: ["how-to-tell-if-food-is-gmo", "what-does-bioengineered-mean", "which-foods-are-gmo"],
  },
  {
    slug: "what-does-bioengineered-mean",
    question: "What does \"bioengineered\" mean on a food label?",
    answer:
      "\"Bioengineered\" is the US government's legal term for what most people call GMO. It means the food contains genetic material that was changed in a lab in a way that could not be achieved by conventional breeding or found in nature, and that the change can still be detected in the food.",
    body: [
      {
        type: "p",
        text: "The term comes from the National Bioengineered Food Disclosure Standard, the federal law that replaced state GMO labeling laws. USDA's Agricultural Marketing Service runs it.",
      },
      { type: "h2", text: "What the label can look like" },
      {
        type: "list",
        items: [
          "The words \"Bioengineered food\" or \"Contains a bioengineered food ingredient\"",
          "A round green USDA symbol that says \"Bioengineered\"",
          "A QR code with text like \"Scan here for more food information\"",
          "A phone number you can text for the disclosure",
        ],
      },
      { type: "h2", text: "Bioengineered vs. \"derived from bioengineering\"" },
      {
        type: "p",
        text: "If an ingredient comes from a BE crop but is so refined that no modified genetic material can be detected, such as many oils and sugars, the maker does not have to disclose it. Some brands choose to say \"Derived from bioengineering\" on those products anyway.",
      },
    ],
    sources: [USDA_BE],
    related: ["why-no-bioengineered-label", "which-foods-are-gmo", "when-did-gmo-labeling-start"],
  },
  {
    slug: "which-foods-are-gmo",
    question: "Which foods are GMO in the US?",
    answer:
      "USDA's List of Bioengineered Foods includes corn, soybeans, canola, cotton, sugar beets, alfalfa, papaya, summer squash, potatoes, apples (Arctic), eggplant, pink pineapple, sugarcane (insect-resistant varieties) and AquAdvantage salmon. In practice, corn, soybeans, canola, cotton and sugar beets matter most, because the vast majority of each grown in the US is bioengineered.",
    body: [
      { type: "h2", text: "The crops that matter most at the grocery store" },
      {
        type: "p",
        text: "According to USDA's Economic Research Service, more than 90% of US corn, soybean and cotton acres are planted with genetically engineered varieties. Canola and sugar beets are similarly dominated by bioengineered varieties. These crops end up in thousands of packaged foods as oils, sweeteners, starches and proteins.",
      },
      { type: "h2", text: "Listed, but rare in stores" },
      {
        type: "p",
        text: "Bioengineered apples, potatoes, pineapple and salmon are on the list, but they are a small share of what is sold. A plain apple or potato is unlikely to be bioengineered unless the package says so.",
      },
      { type: "h2", text: "What is not GMO" },
      {
        type: "p",
        text: "Most fresh fruits and vegetables, wheat, rice, oats and cane sugar sold in the US are not bioengineered, because no bioengineered varieties of them are widely grown here.",
      },
    ],
    sources: [USDA_BE_LIST, USDA_ERS],
    related: ["hidden-gmo-ingredients", "is-sugar-gmo", "is-corn-syrup-gmo"],
  },
  {
    slug: "does-organic-mean-non-gmo",
    question: "Does organic mean non-GMO?",
    answer:
      "Yes. USDA Organic rules prohibit genetic engineering, so a USDA certified organic product cannot be made with GMO ingredients on purpose. It is not tested for trace contamination the way Non-GMO Project Verified products are, but organic farms must take steps to avoid it.",
    body: [
      {
        type: "p",
        text: "Genetic engineering is an \"excluded method\" under the USDA organic regulations. Certifiers inspect the farm and processor records to confirm no GMO seed, feed or ingredients were used.",
      },
      { type: "h2", text: "\"Organic\" vs. \"made with organic\"" },
      {
        type: "p",
        text: "Products labeled \"100% organic\" or \"organic\" must meet the rule for every ingredient they contain. Products labeled \"made with organic ingredients\" still may not use GMO ingredients, even in the non-organic part.",
      },
      {
        type: "p",
        text: "GMO Scan treats a USDA Organic claim in the product's label data as a NO answer.",
      },
    ],
    sources: [USDA_ORGANIC_GMO],
    related: ["non-gmo-project-verified-vs-organic", "how-to-tell-if-food-is-gmo"],
  },
  {
    slug: "non-gmo-project-verified-vs-organic",
    question: "What is the difference between Non-GMO Project Verified and USDA Organic?",
    answer:
      "USDA Organic is a government standard that bans GMOs along with synthetic pesticides, most synthetic fertilizers, antibiotics and more. Non-GMO Project Verified is a private certification focused only on GMOs, with ingredient testing and traceability for crops at high risk of GMO contamination.",
    body: [
      {
        type: "list",
        items: [
          "Who runs it: USDA (organic) vs. the nonprofit Non-GMO Project (butterfly seal).",
          "What it covers: the whole way the food is grown and processed vs. GMOs only.",
          "Testing: organic relies on process inspection; the Non-GMO Project tests high-risk ingredients against action thresholds.",
          "Pesticides: organic restricts them; Non-GMO Project Verified does not.",
        ],
      },
      {
        type: "p",
        text: "If avoiding GMOs is your only goal, either seal works. Many products carry both.",
      },
    ],
    sources: [USDA_ORGANIC_GMO, NON_GMO_PROJECT],
    related: ["does-organic-mean-non-gmo", "how-to-tell-if-food-is-gmo"],
  },
  {
    slug: "hidden-gmo-ingredients",
    question: "Which ingredients are hidden GMOs?",
    answer:
      "The most common hidden GMO ingredients in US packaged food come from corn, soy, canola, cotton and sugar beets: corn syrup, high-fructose corn syrup, corn starch, dextrose, maltodextrin, soybean oil, soy lecithin, soy protein, canola oil, cottonseed oil, vegetable oil and plain \"sugar\". Many need no bioengineered label because they are highly refined.",
    body: [
      { type: "h2", text: "From corn" },
      {
        type: "list",
        items: ["Corn syrup and high-fructose corn syrup", "Corn starch and modified food starch", "Dextrose, glucose and maltodextrin", "Corn oil"],
      },
      { type: "h2", text: "From soy" },
      { type: "list", items: ["Soybean oil", "Soy lecithin", "Soy protein isolate and textured vegetable protein"] },
      { type: "h2", text: "From other crops" },
      {
        type: "list",
        items: [
          "Canola (rapeseed) oil",
          "Cottonseed oil",
          "\"Vegetable oil\", often a blend of soy, canola, corn or cottonseed",
          "\"Sugar\" not labeled cane sugar, which may come from sugar beets",
        ],
      },
      {
        type: "p",
        text: "Organic or Non-GMO Project Verified versions of these ingredients are not GMO. GMO Scan flags these ingredients by name and leaves out ones marked organic.",
      },
    ],
    sources: [USDA_BE_LIST, USDA_ERS],
    related: ["is-corn-syrup-gmo", "is-canola-oil-gmo", "is-sugar-gmo"],
  },
  {
    slug: "is-sugar-gmo",
    question: "Is sugar GMO?",
    answer:
      "It depends on the plant. Cane sugar is not GMO in practice, but sugar from sugar beets almost always is, and beets supply roughly half of the sugar made in the US. If a US ingredient list just says \"sugar\" with no organic or non-GMO claim, it may be beet sugar.",
    body: [
      {
        type: "p",
        text: "Nearly all sugar beets grown in the US are bioengineered for herbicide tolerance. USDA also added an insect-resistant sugarcane to its bioengineered foods list, but it is not widely grown for the US market.",
      },
      { type: "h2", text: "How to avoid GMO sugar" },
      {
        type: "list",
        items: ["Look for \"cane sugar\" in the ingredients", "Choose USDA Organic or Non-GMO Project Verified products"],
      },
      {
        type: "p",
        text: "Refined sugar contains no detectable modified DNA, so beet sugar products often carry no bioengineered label even though the beets were bioengineered.",
      },
    ],
    sources: [USDA_BE_LIST],
    related: ["hidden-gmo-ingredients", "why-no-bioengineered-label"],
  },
  {
    slug: "is-corn-syrup-gmo",
    question: "Is corn syrup GMO?",
    answer:
      "Usually, yes. More than 90% of corn grown in the US is genetically engineered, so corn syrup and high-fructose corn syrup are almost always made from GMO corn unless the product is organic or Non-GMO Project Verified.",
    body: [
      {
        type: "p",
        text: "Because corn syrup is highly refined, it may not contain detectable modified genetic material, so products made with it often do not need a bioengineered label. The same goes for dextrose, maltodextrin and corn starch.",
      },
    ],
    sources: [USDA_ERS],
    related: ["hidden-gmo-ingredients", "which-foods-are-gmo"],
  },
  {
    slug: "is-canola-oil-gmo",
    question: "Is canola oil GMO?",
    answer:
      "Most canola oil from North America is made from genetically engineered canola, since the large majority of canola grown in the US and Canada is bioengineered. Choose organic or Non-GMO Project Verified canola oil to avoid it.",
    body: [
      {
        type: "p",
        text: "Like soybean oil and cottonseed oil, canola oil is highly refined, so it often carries no bioengineered label even when it comes from bioengineered seed. \"Vegetable oil\" on a label is frequently canola, soy or a blend.",
      },
    ],
    sources: [USDA_BE_LIST],
    related: ["hidden-gmo-ingredients", "why-no-bioengineered-label"],
  },
  {
    slug: "why-no-bioengineered-label",
    question: "Why doesn't my food have a bioengineered label if it contains corn or soy?",
    answer:
      "The US disclosure law has several exemptions. The most common is that highly refined ingredients, such as most oils, sugars and syrups, do not need a label if no modified genetic material can be detected. Very small food makers, restaurants, and meat, eggs and dairy from animals fed GMO feed are also exempt.",
    body: [
      { type: "h2", text: "Main exemptions under the National Bioengineered Food Disclosure Standard" },
      {
        type: "list",
        items: [
          "Highly refined ingredients with no detectable modified genetic material",
          "Food served in restaurants and similar retail food establishments",
          "Very small food manufacturers",
          "Meat, poultry and eggs as main products, and food from animals that only ate bioengineered feed",
          "Small amounts of bioengineered material present by accident (up to 5% of an ingredient)",
          "Certified organic food",
        ],
      },
      {
        type: "p",
        text: "That is why GMO Scan also reads the ingredient list. A product with soybean oil and corn syrup gets a likely-GMO answer even with no label, and the app tells you it was inferred rather than officially disclosed.",
      },
    ],
    sources: [USDA_BE],
    related: ["what-does-bioengineered-mean", "hidden-gmo-ingredients", "how-to-tell-if-food-is-gmo"],
  },
  {
    slug: "when-did-gmo-labeling-start",
    question: "When did GMO labeling become required in the US?",
    answer:
      "Mandatory bioengineered food labeling took full effect in the US on January 1, 2022. The law was passed in 2016, USDA issued the rule in December 2018, and companies could start using the labels voluntarily in 2020.",
    body: [
      {
        type: "list",
        items: [
          "July 2016: Congress passes the National Bioengineered Food Disclosure Standard, overriding state GMO label laws such as Vermont's.",
          "December 2018: USDA publishes the final rule.",
          "January 1, 2020: implementation begins for most companies.",
          "January 1, 2021: implementation begins for small food manufacturers.",
          "January 1, 2022: compliance becomes mandatory for everyone covered.",
        ],
      },
    ],
    sources: [USDA_BE],
    related: ["what-does-bioengineered-mean", "why-no-bioengineered-label"],
  },
  {
    slug: "are-gmos-safe-to-eat",
    question: "Are GMO foods safe to eat?",
    answer:
      "Major scientific bodies, including the US National Academies of Sciences, Engineering, and Medicine in its 2016 review, found no substantiated evidence that foods from approved genetically engineered crops are less safe to eat than conventional foods. Many people still choose to avoid GMOs for reasons such as farming practices, herbicide use, or personal preference.",
    body: [
      {
        type: "p",
        text: "GMO Scan does not tell you what to eat. It tells you what is in the food so you can decide for yourself, and it shows where each answer came from: an official disclosure, a certification, or an ingredient match.",
      },
    ],
    sources: [
      {
        label: "National Academies: Genetically Engineered Crops: Experiences and Prospects (2016)",
        url: "https://nap.nationalacademies.org/catalog/23395/genetically-engineered-crops-experiences-and-prospects",
      },
    ],
    related: ["how-to-tell-if-food-is-gmo", "what-does-bioengineered-mean"],
  },
];

export function getQuestion(slug: string): Question | undefined {
  return QUESTIONS.find((q) => q.slug === slug);
}
