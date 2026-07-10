"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthProvider";
import { AuthPanel } from "@/components/AuthPanel";
import { checkBioengineered } from "@/lib/beCheck";

type BEVerdict = "confirmed_be" | "likely_be" | "verified_non_gmo" | "unknown";
type ScanSource = "barcode_scan" | "manual_entry";

interface BEResult {
  verdict: BEVerdict;
  headline: string;
  matchedIngredients: string[];
  explanation: string;
  hasData: boolean;
}

interface LookupResponse {
  product: {
    name: string | null;
    brand: string | null;
    imageUrl: string | null;
    found: boolean;
  };
  beResult: BEResult;
}

const VERDICT_STYLE: Record<BEVerdict, { bg: string; label: string }> = {
  confirmed_be: { bg: "bg-stamp", label: "BIOENGINEERED" },
  likely_be: { bg: "bg-stamp/80", label: "LIKELY BIOENGINEERED" },
  verified_non_gmo: { bg: "bg-verified", label: "NON-GMO VERIFIED" },
  unknown: { bg: "bg-manifest", label: "UNKNOWN" },
};

// "unknown" covers two very different situations: a genuine data gap, vs.
// having checked real ingredient data and found nothing flagged. The latter
// is an actual answer and should read like one.
function getDisplayStyle(beResult: BEResult) {
  if (beResult.verdict === "unknown" && beResult.hasData) {
    return { bg: "bg-verified/70", label: "NO BE DETECTED" };
  }
  return VERDICT_STYLE[beResult.verdict];
}

export default function ScanPage() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const [manualIngredients, setManualIngredients] = useState("");
  const [checkingIngredients, setCheckingIngredients] = useState(false);
  const [readingPhoto, setReadingPhoto] = useState(false);

  async function saveScan(
    barcode: string | null,
    product: LookupResponse["product"],
    beResult: BEResult,
    source: ScanSource
  ) {
    if (!user) return;
    const { error: insertError } = await supabase.from("scans").insert({
      user_id: user.id,
      barcode,
      product_name: product.name,
      brand: product.brand,
      verdict: beResult.verdict,
      matched_ingredients: beResult.matchedIngredients,
      source,
    });
    if (!insertError) setSaved(true);
  }

  async function runLookup(barcode: string, source: ScanSource) {
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    setManualIngredients("");
    setLastBarcode(barcode);
    try {
      const res = await fetch(`/api/lookup?barcode=${encodeURIComponent(barcode)}`);
      if (!res.ok) throw new Error("Lookup failed");
      const data: LookupResponse = await res.json();
      setResult(data);
      await saveScan(barcode, data.product, data.beResult, source);
    } catch (e) {
      setError("Couldn't complete that lookup. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function checkManualIngredients() {
    if (!manualIngredients.trim() || !result) return;
    setCheckingIngredients(true);
    try {
      const beResult = checkBioengineered({ ingredientsText: manualIngredients });
      const updated: LookupResponse = { ...result, beResult };
      setResult(updated);
      setSaved(false);
      await saveScan(lastBarcode, updated.product, beResult, "manual_entry");
    } finally {
      setCheckingIngredients(false);
    }
  }

  async function handleIngredientsPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setReadingPhoto(true);
    setError(null);
    try {
      const { recognize } = await import("tesseract.js");
      const {
        data: { text },
      } = await recognize(file, "eng");
      const cleaned = text.trim();
      if (!cleaned) {
        setError("Couldn't read any text from that photo. Try a clearer shot or type the ingredients instead.");
        return;
      }
      setManualIngredients((prev) => (prev ? `${prev}\n${cleaned}` : cleaned));
    } catch (err) {
      setError("Couldn't read that photo. Try again or type the ingredients instead.");
    } finally {
      setReadingPhoto(false);
    }
  }

  useEffect(() => {
    if (!scanning) return;
    const reader = new BrowserMultiFormatReader();
    let active = true;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (res, err) => {
        if (res && active) {
          active = false;
          setScanning(false);
          runLookup(res.getText(), "barcode_scan");
        }
      })
      .catch(() => {
        setError("Camera access failed. You can enter the barcode manually instead.");
        setScanning(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const style = result ? getDisplayStyle(result.beResult) : null;
  const needsManualIngredients = result && !result.beResult.hasData;

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <header className="mb-8 flex items-baseline justify-between border-b-2 border-ink pb-3">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
          GMO Scan
        </h1>
        <span className="font-mono text-xs text-manifest">FORM BE-01</span>
      </header>

      <AuthPanel />

      {!scanning && !result && (
        <div className="space-y-4">
          <button
            onClick={() => setScanning(true)}
            className="w-full rounded-sm border-2 border-ink bg-ink py-4 font-display text-xl font-semibold uppercase tracking-wide text-paper transition hover:bg-ink/90"
          >
            Scan a barcode
          </button>

          <div className="flex items-center gap-3 font-mono text-xs uppercase text-manifest">
            <div className="h-px flex-1 bg-manifest/40" />
            or enter manually
            <div className="h-px flex-1 bg-manifest/40" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualBarcode.trim()) runLookup(manualBarcode.trim(), "manual_entry");
            }}
            className="flex gap-2"
          >
            <input
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="UPC / EAN barcode"
              className="flex-1 rounded-sm border-2 border-ink bg-paper px-3 py-2 font-mono text-sm outline-none focus:border-stamp"
            />
            <button
              type="submit"
              className="rounded-sm border-2 border-ink px-4 font-display text-sm font-semibold uppercase text-ink hover:bg-ink hover:text-paper"
            >
              Check
            </button>
          </form>
        </div>
      )}

      {scanning && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-sm border-2 border-ink">
            <video ref={videoRef} className="w-full" />
          </div>
          <button
            onClick={() => setScanning(false)}
            className="w-full rounded-sm border-2 border-ink py-2 font-display text-sm font-semibold uppercase tracking-wide"
          >
            Cancel
          </button>
        </div>
      )}

      {loading && (
        <p className="mt-6 text-center font-mono text-sm text-manifest">
          Looking up product…
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-sm border-2 border-stamp bg-stamp/10 p-3 font-mono text-sm text-stamp">
          {error}
        </p>
      )}

      {result && style && (
        <div className="mt-6 space-y-4">
          <div className={`${style.bg} rounded-sm p-4 text-paper`}>
            <p className="font-mono text-xs uppercase tracking-widest opacity-80">
              {style.label}
            </p>
            <p className="font-display text-2xl font-bold">
              {result.beResult.headline}
            </p>
          </div>

          {result.product.found && (
            <div className="border-2 border-ink p-4">
              <p className="font-display text-lg font-semibold">
                {result.product.name || "Unnamed product"}
              </p>
              {result.product.brand && (
                <p className="font-mono text-xs text-manifest">
                  {result.product.brand}
                </p>
              )}
            </div>
          )}

          <p className="font-body text-sm leading-relaxed text-ink/80">
            {result.beResult.explanation}
          </p>

          <p className="font-mono text-xs uppercase text-manifest">
            {user
              ? saved
                ? "Saved to your scan history"
                : "Couldn't save this scan — try again"
              : "Sign in above to save your scan history"}
          </p>

          {result.beResult.matchedIngredients.length > 0 && (
            <div>
              <p className="font-mono text-xs uppercase text-manifest">
                Flagged ingredients
              </p>
              <ul className="mt-1 space-y-1 font-mono text-sm">
                {result.beResult.matchedIngredients.map((ing) => (
                  <li key={ing}>— {ing}</li>
                ))}
              </ul>
            </div>
          )}

          {needsManualIngredients && (
            <div className="border-2 border-ink/20 p-3">
              <p className="mb-2 font-mono text-xs uppercase text-manifest">
                Get a real answer: photograph or paste the ingredient list
              </p>

              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm border-2 border-ink px-3 py-2 font-mono text-xs uppercase text-ink transition hover:bg-ink hover:text-paper aria-disabled:pointer-events-none aria-disabled:opacity-50">
                {readingPhoto ? "Reading photo…" : "Take a photo of ingredients"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleIngredientsPhoto}
                  disabled={readingPhoto}
                  aria-disabled={readingPhoto}
                  className="hidden"
                />
              </label>

              <textarea
                value={manualIngredients}
                onChange={(e) => setManualIngredients(e.target.value)}
                placeholder="e.g. Corn syrup, soybean oil, salt, natural flavors..."
                rows={3}
                className="mt-2 w-full rounded-sm border-2 border-ink bg-paper px-3 py-2 font-mono text-sm outline-none focus:border-stamp"
              />
              <button
                onClick={checkManualIngredients}
                disabled={!manualIngredients.trim() || checkingIngredients}
                className="mt-2 w-full rounded-sm border-2 border-ink bg-ink py-2 font-display text-sm font-semibold uppercase tracking-wide text-paper transition hover:bg-ink/90 disabled:opacity-50"
              >
                Check these ingredients
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setResult(null);
              setManualBarcode("");
              setManualIngredients("");
              setSaved(false);
            }}
            className="w-full rounded-sm border-2 border-ink py-3 font-display text-lg font-semibold uppercase tracking-wide hover:bg-ink hover:text-paper"
          >
            Scan another
          </button>
        </div>
      )}
    </main>
  );
}
