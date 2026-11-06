import type { Metadata } from "next";
import Link from "next/link";
import { DEVELOPER_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Delete your account — GMO Scan",
};

// Google Play requires a web page where people can ask for their account to
// be deleted, linked from the app and from the store listing.
export default function DeleteAccountPage() {
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "Delete my GMO Scan account"
  )}&body=${encodeURIComponent(
    "Please delete my GMO Scan account and all data stored with it. My account email is: "
  )}`;

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <header className="mb-8 flex items-baseline justify-between border-b-2 border-ink pb-3">
        <Link href="/" className="font-display text-3xl font-bold uppercase tracking-tight">
          GMO Scan
        </Link>
        <span className="font-mono text-xs text-manifest">ACCOUNT</span>
      </header>

      <div className="space-y-4 font-body text-sm leading-relaxed text-ink/90">
        <h1 className="font-display text-2xl font-bold uppercase">Delete your GMO Scan account</h1>
        <p>
          Email us from the address you signed up with, and {DEVELOPER_NAME} will delete your
          account within 30 days.
        </p>
        <a
          href={mailto}
          className="block w-full rounded-sm border-2 border-ink bg-ink py-3 text-center font-display text-lg font-semibold uppercase tracking-wide text-paper hover:bg-ink/90"
        >
          Request deletion
        </a>
        <p className="font-mono text-xs text-manifest">Or write to {SUPPORT_EMAIL}</p>
        <p>
          <strong>What is deleted:</strong> your email address, password, and your whole scan
          history. Nothing is kept afterwards.
        </p>
        <p>
          You can also delete single scans yourself at any time from your{" "}
          <Link href="/history" className="underline">
            scan history
          </Link>
          .
        </p>
        <p>
          <Link href="/privacy" className="underline">
            Privacy policy
          </Link>
        </p>
      </div>
    </main>
  );
}
