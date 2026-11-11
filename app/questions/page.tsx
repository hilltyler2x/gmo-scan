import type { Metadata } from "next";
import Link from "next/link";
import { QUESTIONS } from "@/lib/questions";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `GMO questions, answered | ${SITE_NAME}`,
  description:
    "Plain answers to common questions about GMOs, bioengineered food labels, and how to tell if a food is GMO.",
  alternates: { canonical: "/questions" },
};

export default function QuestionsIndex() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: QUESTIONS.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mb-8 flex items-baseline justify-between border-b-2 border-ink pb-3">
        <Link href="/" className="font-display text-3xl font-bold uppercase tracking-tight">
          GMO Scan
        </Link>
        <span className="font-mono text-xs text-manifest">QUESTIONS</span>
      </header>

      <h1 className="mb-6 font-display text-2xl font-bold uppercase">GMO questions, answered</h1>
      <ul className="space-y-5">
        {QUESTIONS.map((q) => (
          <li key={q.slug}>
            <Link href={`/questions/${q.slug}`} className="font-display text-lg font-semibold leading-snug underline hover:text-stamp">
              {q.question}
            </Link>
            <p className="mt-1 font-body text-sm leading-relaxed text-ink/80">{q.answer}</p>
          </li>
        ))}
      </ul>

      <Link
        href="/"
        className="mt-10 block w-full rounded-sm border-2 border-ink bg-ink py-4 text-center font-display text-xl font-semibold uppercase tracking-wide text-paper transition hover:bg-ink/90"
      >
        Scan a barcode
      </Link>
    </main>
  );
}
