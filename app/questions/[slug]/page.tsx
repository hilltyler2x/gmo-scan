import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QUESTIONS, getQuestion, type Block } from "@/lib/questions";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

// Every question page is built ahead of time, so crawlers (which mostly don't
// run JavaScript) get the full answer in the HTML.
export const dynamicParams = false;

export function generateStaticParams() {
  return QUESTIONS.map((q) => ({ slug: q.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const q = getQuestion(params.slug);
  if (!q) return {};
  const path = `/questions/${q.slug}`;
  return {
    title: `${q.question} | ${SITE_NAME}`,
    description: q.answer,
    alternates: { canonical: path },
    openGraph: { title: q.question, description: q.answer, url: path, type: "article", siteName: SITE_NAME },
  };
}

function BlockView({ block }: { block: Block }) {
  if (block.type === "h2") return <h2>{block.text}</h2>;
  if (block.type === "p") return <p>{block.text}</p>;
  return (
    <ul>
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function QuestionPage({ params }: { params: { slug: string } }) {
  const q = getQuestion(params.slug);
  if (!q) notFound();
  const related = q.related.map(getQuestion).filter((r) => r !== undefined);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: q.question,
          acceptedAnswer: { "@type": "Answer", text: q.answer },
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "GMO questions", item: `${SITE_URL}/questions` },
        { "@type": "ListItem", position: 3, name: q.question, item: `${SITE_URL}/questions/${q.slug}` },
      ],
    },
  ];

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mb-8 flex items-baseline justify-between border-b-2 border-ink pb-3">
        <Link href="/" className="font-display text-3xl font-bold uppercase tracking-tight">
          GMO Scan
        </Link>
        <Link href="/questions" className="font-mono text-xs uppercase text-manifest hover:text-ink hover:underline">
          All questions
        </Link>
      </header>

      <article className="space-y-4 font-body text-sm leading-relaxed text-ink/90 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:uppercase [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        <h1 className="font-display text-2xl font-bold uppercase leading-tight">{q.question}</h1>
        <p className="border-l-4 border-stamp pl-3 text-base text-ink">{q.answer}</p>
        {q.body.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}

        {q.sources && q.sources.length > 0 && (
          <>
            <h2>Sources</h2>
            <ul>
              {q.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} className="underline hover:text-stamp" rel="noopener">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </article>

      <Link
        href="/"
        className="mt-8 block w-full rounded-sm border-2 border-ink bg-ink py-4 text-center font-display text-xl font-semibold uppercase tracking-wide text-paper transition hover:bg-ink/90"
      >
        Scan a barcode
      </Link>

      {related.length > 0 && (
        <nav className="mt-8">
          <p className="mb-2 font-mono text-xs uppercase text-manifest">Related questions</p>
          <ul className="space-y-2 font-body text-sm">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/questions/${r.slug}`} className="underline hover:text-stamp">
                  {r.question}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </main>
  );
}
