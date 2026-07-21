"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthProvider";

type BEVerdict = "confirmed_be" | "likely_be" | "verified_non_gmo" | "unknown";

interface ScanRow {
  id: string;
  barcode: string | null;
  product_name: string | null;
  brand: string | null;
  verdict: BEVerdict | null;
  matched_ingredients: string[] | null;
  source: "barcode_scan" | "manual_entry" | "receipt_ocr" | null;
  created_at: string;
}

// `answer` is the direct yes/no, matching the same treatment used on the
// scan page — the more precise wording stays as supporting detail below it.
const VERDICT_BADGE: Record<BEVerdict, { bg: string; label: string; answer: string }> = {
  confirmed_be: { bg: "bg-stamp", label: "Official disclosure", answer: "YES" },
  likely_be: { bg: "bg-stamp/80", label: "Inferred from ingredients", answer: "YES" },
  verified_non_gmo: { bg: "bg-verified", label: "Certified non-GMO", answer: "NO" },
  unknown: { bg: "bg-manifest", label: "Not enough information", answer: "?" },
};

const SOURCE_LABEL: Record<string, string> = {
  barcode_scan: "Barcode scan",
  manual_entry: "Manual entry",
  receipt_ocr: "Receipt OCR",
};

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [scans, setScans] = useState<ScanRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("scans")
      .select("id, barcode, product_name, brand, verdict, matched_ingredients, source, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError("Couldn't load your scan history. Try again.");
        } else {
          setScans(data as ScanRow[]);
        }
      });
  }, [user]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setConfirmingId(null);
    setError(null);

    // .select() makes Postgrest return the deleted row(s) so we can tell a
    // real delete apart from a no-op silently blocked by RLS (which returns
    // no error and an empty array, not a failure) — without this, a missing
    // delete policy would look like success in the UI while nothing was
    // actually deleted server-side.
    const { data, error: deleteError } = await supabase
      .from("scans")
      .delete()
      .eq("id", id)
      .select();

    if (deleteError || !data || data.length === 0) {
      setError("Couldn't delete that scan. Try again.");
    } else {
      setScans((prev) => prev && prev.filter((s) => s.id !== id));
    }
    setDeletingId(null);
  }

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <header className="mb-8 flex items-baseline justify-between border-b-2 border-ink pb-3">
        <Link href="/" className="font-display text-3xl font-bold uppercase tracking-tight">
          GMO Scan
        </Link>
        <span className="font-mono text-xs text-manifest">SCAN HISTORY</span>
      </header>

      {!authLoading && !user && (
        <div className="border-2 border-ink/20 p-4 text-center">
          <p className="font-body text-sm text-ink/80">
            Sign in to view your scan history.
          </p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-sm border-2 border-ink px-4 py-2 font-display text-sm font-semibold uppercase text-ink hover:bg-ink hover:text-paper"
          >
            Back to scanner
          </Link>
        </div>
      )}

      {user && scans === null && !error && (
        <p className="text-center font-mono text-sm text-manifest">Loading…</p>
      )}

      {error && (
        <p className="rounded-sm border-2 border-stamp bg-stamp/10 p-3 font-mono text-sm text-stamp">
          {error}
        </p>
      )}

      {user && scans && scans.length === 0 && (
        <div className="border-2 border-ink/20 p-4 text-center">
          <p className="font-body text-sm text-ink/80">
            No scans yet — go scan something!
          </p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-sm border-2 border-ink px-4 py-2 font-display text-sm font-semibold uppercase text-ink hover:bg-ink hover:text-paper"
          >
            Scan a barcode
          </Link>
        </div>
      )}

      {user && scans && scans.length > 0 && (
        <div className="space-y-3">
          {scans.map((scan) => {
            const badge = scan.verdict ? VERDICT_BADGE[scan.verdict] : null;
            return (
              <div key={scan.id} className="border-2 border-ink/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold">
                      {scan.product_name || scan.barcode || "Unnamed scan"}
                    </p>
                    {scan.brand && (
                      <p className="truncate font-mono text-xs text-manifest">
                        {scan.brand}
                      </p>
                    )}
                  </div>
                  {badge && (
                    <div className="flex shrink-0 flex-col items-end">
                      <span
                        className={`${badge.bg} rounded-sm px-2 py-1 font-display text-sm font-bold text-paper`}
                      >
                        {badge.answer}
                      </span>
                      <span className="mt-1 font-mono text-[9px] uppercase tracking-wide text-manifest">
                        {badge.label}
                      </span>
                    </div>
                  )}
                </div>

                {scan.matched_ingredients && scan.matched_ingredients.length > 0 && (
                  <p className="mt-2 font-mono text-xs text-ink/70">
                    Flagged: {scan.matched_ingredients.join(", ")}
                  </p>
                )}

                <div className="mt-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-wide text-manifest">
                  <span>{scan.source ? SOURCE_LABEL[scan.source] : ""}</span>
                  <span>
                    {new Date(scan.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                {confirmingId === scan.id ? (
                  <div className="mt-2 flex items-center gap-3 font-mono text-[11px] uppercase tracking-wide">
                    <span className="text-ink/70">Delete this scan?</span>
                    <button
                      onClick={() => handleDelete(scan.id)}
                      disabled={deletingId === scan.id}
                      className="text-stamp hover:underline disabled:opacity-50"
                    >
                      {deletingId === scan.id ? "Deleting…" : "Confirm"}
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="text-manifest hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingId(scan.id)}
                    className="mt-2 font-mono text-[11px] uppercase tracking-wide text-stamp hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
