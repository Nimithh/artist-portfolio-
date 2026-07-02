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
        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
      >
        <Flag className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="animate-modal-in w-full max-w-md rounded-xl bg-surface p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">Report this artwork</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {done ? (
              <div className="mt-4">
                <p className="text-foreground">
                  Thank you. The report was submitted and will be reviewed.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-4 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-4">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-foreground">
                    Why are you reporting this?
                  </legend>
                  {REASONS.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="radio"
                        name="reason"
                        value={option.value}
                        checked={reason === option.value}
                        onChange={() => setReason(option.value)}
                        className="accent-accent"
                      />
                      {option.label}
                    </label>
                  ))}
                </fieldset>
                <div>
                  <label htmlFor={`note-${artworkId}`} className="text-sm font-medium text-foreground">
                    Details (optional)
                  </label>
                  <textarea
                    id={`note-${artworkId}`}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={500}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
                  />
                </div>
                {message && <p className="text-sm text-red-600">{message}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
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
