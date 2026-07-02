"use client";

// Small flag button on each artwork that opens an anonymous report form.

import { useState } from "react";
import { Flag, Loader2, X } from "lucide-react";

const REASONS = [
  { value: "stolen_art", label: "Stolen art" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

export default function ReportButton({ artworkId }: { artworkId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("stolen_art");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkId, reason, note }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(body.error ?? "Could not submit the report. Please try again.");
      } else {
        setDone(true);
      }
    } catch {
      setMessage("Could not submit the report. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function close() {
    setOpen(false);
    setMessage(null);
    setDone(false);
    setNote("");
    setReason("stolen_art");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report this artwork"
        title="Report this artwork"
        className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
      >
        <Flag className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Report this artwork</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {done ? (
              <div className="mt-4">
                <p className="text-zinc-700">
                  Thank you. The report was submitted and will be reviewed.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm text-white hover:bg-zinc-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-4">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-zinc-700">
                    Why are you reporting this?
                  </legend>
                  {REASONS.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="reason"
                        value={option.value}
                        checked={reason === option.value}
                        onChange={() => setReason(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </fieldset>
                <div>
                  <label htmlFor={`note-${artworkId}`} className="text-sm font-medium text-zinc-700">
                    Details (optional)
                  </label>
                  <textarea
                    id={`note-${artworkId}`}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={500}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-zinc-300 p-2 text-sm outline-none focus:border-zinc-500"
                  />
                </div>
                {message && <p className="text-sm text-red-600">{message}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit report
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
