import type { Metadata } from "next";
import Link from "next/link";
import { DEVELOPER_NAME, POLICY_UPDATED, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy — GMO Scan",
};

// Keep this in step with what the app actually does, and with the Data
// safety (Google Play) and App Privacy (App Store) answers in
// docs/google-play.md. A mismatch is a common reason for store rejection.
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <header className="mb-8 flex items-baseline justify-between border-b-2 border-ink pb-3">
        <Link href="/" className="font-display text-3xl font-bold uppercase tracking-tight">
          GMO Scan
        </Link>
        <span className="font-mono text-xs text-manifest">PRIVACY</span>
      </header>

      <article className="space-y-4 font-body text-sm leading-relaxed text-ink/90 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:uppercase [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        <h1 className="font-display text-2xl font-bold uppercase">Privacy Policy</h1>
        <p className="font-mono text-xs text-manifest">Last updated {POLICY_UPDATED}</p>

        <p>
          GMO Scan is made by {DEVELOPER_NAME}. This policy covers the GMO Scan website and the
          GMO Scan apps for iPhone and Android.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Your email address and password</strong>, only if you create an account.
            Passwords are stored hashed by our sign-in provider, Supabase; we never see them.
          </li>
          <li>
            <strong>Your scan history</strong>, only while you are signed in: the barcode, product
            name and brand, the result, any flagged ingredients, whether you scanned or typed it,
            and when.
          </li>
        </ul>
        <p>You can scan without an account. Then nothing is saved.</p>

        <h2>What stays on your phone</h2>
        <ul>
          <li>
            <strong>Camera.</strong> The camera is used only while you scan a barcode or
            photograph an ingredient list. Video is read on your device and never uploaded.
          </li>
          <li>
            <strong>Ingredient photos.</strong> Text is read from the photo on your device. The
            photo is not uploaded or stored.
          </li>
        </ul>

        <h2>Who else sees data</h2>
        <ul>
          <li>
            To look up a product, the barcode number is sent to our server, which asks Open Food
            Facts and the USDA FoodData Central database. Only the barcode is sent, not who you are.
          </li>
          <li>Your account and scan history are stored with Supabase, our database provider.</li>
          <li>Our website and server run on Vercel.</li>
        </ul>
        <p>
          We do not sell your data, show ads, or use it for tracking. We do not share it with
          anyone else unless the law requires it.
        </p>

        <h2>Security</h2>
        <p>
          All data travels over encrypted connections (HTTPS). Database rules let each account
          read and change only its own scan history.
        </p>

        <h2>Deleting your data</h2>
        <p>
          You can delete any scan from your history in the app. To delete your account and
          everything stored with it, see <Link href="/delete-account" className="underline">Delete
          your account</Link>.
        </p>

        <h2>Children</h2>
        <p>GMO Scan is not directed at children under 13, and we do not knowingly collect their data.</p>

        <h2>Changes and contact</h2>
        <p>
          If this policy changes, the date above changes with it. Questions:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </article>
    </main>
  );
}
