import { QUESTIONS } from "@/lib/questions";
import { SITE_URL } from "@/lib/seo";

// /llms.txt: a plain-text summary of the site for AI assistants
// (https://llmstxt.org). Built once at deploy time from lib/questions.ts.
export const dynamic = "force-static";

export function GET() {
  const lines = [
    "# GMO Scan",
    "",
    "> GMO Scan tells you if a packaged food is bioengineered (GMO). Scan the barcode with your phone camera, or photograph or type the ingredient list, and get a YES, NO or UNKNOWN answer with the ingredients that caused it.",
    "",
    "How it decides, in order: (1) an official USDA bioengineered disclosure in the product's label data, (2) a USDA Organic or Non-GMO Project Verified claim, (3) ingredients made from crops on the USDA List of Bioengineered Foods (corn, soy, canola, cotton, sugar beet and others), (4) otherwise UNKNOWN. Product data comes from Open Food Facts. Ingredient photos are read on the phone and not uploaded.",
    "",
    `- [Scan a barcode](${SITE_URL}/): the app, works in any phone browser`,
    "",
    "## GMO questions, answered",
    "",
    ...QUESTIONS.map((q) => `- [${q.question}](${SITE_URL}/questions/${q.slug}): ${q.answer}`),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
