"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  defaultContent,
  contentLimits,
  type SiteContent,
  type ContentRecord,
} from "@/lib/site-content";
const groups: {
  title: string;
  fields: [Exclude<keyof SiteContent, "launchEnabled">, string][];
}[] = [
  {
    title: "Homepage campaign",
    fields: [
      ["heroKicker", "Opening line"],
      ["heroLine1", "Headline line 1"],
      ["heroLine2", "Headline line 2"],
      ["heroDescription", "Campaign description"],
      ["heroImage", "Campaign image URL"],
      ["heroAlt", "Image description"],
      ["heroLabel", "Button label"],
      ["heroHref", "Button destination"],
      ["heroNote", "Side note"],
    ],
  },
  {
    title: "Announcement and introduction",
    fields: [
      ["announcement", "Announcement text"],
      ["announcementHref", "Announcement destination"],
      ["introTitle", "Introduction headline"],
      ["introText", "Introduction description"],
    ],
  },
  {
    title: "Customer contact",
    fields: [
      ["supportEmail", "Support email"],
      ["supportPhone", "Support phone"],
      ["supportHours", "Support hours"],
      ["businessAddress", "Business address"],
    ],
  },
  {
    title: "Store information",
    fields: [
      ["shippingInfo", "Delivery information"],
      ["returnsInfo", "Returns and refunds information"],
      ["termsInfo", "Additional store terms"],
      ["privacyInfo", "Additional privacy information"],
    ],
  },
];
export function ContentEditor() {
  const [record, setRecord] = useState<ContentRecord | null>(null),
    [form, setForm] = useState(defaultContent),
    [baseline, setBaseline] = useState(JSON.stringify(defaultContent)),
    [revisions, setRevisions] = useState<{ id: string; created_at: string }[]>(
      [],
    );
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [uncertain, setUncertain] = useState(false),
    [reload, setReload] = useState(0),
    [confirm, setConfirm] = useState(false);
  const dirty = JSON.stringify(form) !== baseline;
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/admin/content", { cache: "no-store", signal: ctrl.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then((d) => {
        if (!ctrl.signal.aborted) {
          const draft = { ...defaultContent, ...d.content.draft };
          setRecord(d.content);
          setForm(draft);
          setBaseline(JSON.stringify(draft));
          setRevisions(d.revisions);
          setError("");
          setUncertain(false);
        }
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e.message);
      });
    return () => ctrl.abort();
  }, [reload]);
  useEffect(() => {
    if (!dirty && !busy) return;
    function unload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", unload);
    function navigate(event: MouseEvent) {
      if (
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element).closest?.("a");
      if (
        !link ||
        link.target === "_blank" ||
        link.getAttribute("href")?.startsWith("#")
      )
        return;
      if (busy || !window.confirm("Leave content and discard unsaved edits?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty, busy]);
  async function action(action: string, revision?: string) {
    if (!record || busy || uncertain) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          document: form,
          version: record.version,
          revision,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessage(
        action === "publish"
          ? "Published. The storefront now uses this content."
          : action === "restore"
            ? "Revision restored as a draft. Preview before publishing."
            : "Draft saved. The public site has not changed.",
      );
      setUncertain(true);
      setReload((n) => n + 1);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not confirm this change. Reload saved content.",
      );
      setUncertain(true);
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }
  return (
    <>
      <div className="content-editor-actions">
        <button
          className="admin-secondary"
          disabled={busy}
          onClick={() => {
            if (!dirty || window.confirm("Discard unsaved content and reload?"))
              setReload((n) => n + 1);
          }}
        >
          Reload saved content
        </button>
        {record && (
          <Link
            className="admin-secondary"
            href="/admin/content/preview"
            target="_blank"
          >
            Preview saved draft
          </Link>
        )}
      </div>
      {error && (
        <p className="admin-message" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="admin-message is-success" role="status">
          {message}
        </p>
      )}
      {record && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action("save");
          }}
        >
          <fieldset
            disabled={busy || uncertain}
            className="content-editor-fields"
          >
            {groups.map((g) => (
              <section key={g.title} className="admin-editor-section">
                <h2>{g.title}</h2>
                {g.title === "Store information" && (
                  <p>
                    Plain text only. Publish the actual policies and staffed
                    contact details before opening orders. Empty fields keep the
                    prelaunch information.
                  </p>
                )}
                <div className="content-field-grid">
                  {g.fields.map(([key, label]) => (
                    <label
                      key={key}
                      className={
                        contentLimits[key] > 300 ? "content-field-wide" : ""
                      }
                    >
                      {label}
                      {contentLimits[key] > 300 ? (
                        <textarea
                          rows={5}
                          maxLength={contentLimits[key]}
                          value={form[key]}
                          onChange={(e) =>
                            setForm({ ...form, [key]: e.target.value })
                          }
                        />
                      ) : (
                        <input
                          maxLength={contentLimits[key]}
                          value={form[key]}
                          onChange={(e) =>
                            setForm({ ...form, [key]: e.target.value })
                          }
                        />
                      )}
                    </label>
                  ))}
                </div>
              </section>
            ))}
            <section className="admin-editor-section">
              <h2>Launch interest</h2>
              <label className="order-checkbox">
                <input
                  type="checkbox"
                  checked={form.launchEnabled}
                  onChange={(e) =>
                    setForm({ ...form, launchEnabled: e.target.checked })
                  }
                />
                Show the launch interest form
              </label>
              <p>
                Signups require explicit permission. Emails stay inactive until
                sender credentials and the final brand are configured. Turning
                this on does not enable checkout.
              </p>
            </section>
            <div className="content-editor-actions">
              <button className="admin-primary" type="submit">
                {busy ? "Saving…" : "Save draft"}
              </button>
              <button
                className="admin-secondary"
                type="button"
                disabled={dirty}
                onClick={() => setConfirm(true)}
              >
                Publish saved draft
              </button>
            </div>
          </fieldset>
        </form>
      )}
      {revisions.length > 0 && (
        <section className="content-revisions">
          <h2>Published history</h2>
          {revisions.map((r) => (
            <div key={r.id}>
              <span>{new Date(r.created_at).toLocaleString("en-PK")}</span>
              <button
                className="order-link-button"
                disabled={busy || uncertain || dirty}
                onClick={() => {
                  if (
                    window.confirm(
                      "Restore this published revision as a new draft?",
                    )
                  )
                    void action("restore", r.id);
                }}
              >
                Restore as draft
              </button>
            </div>
          ))}
        </section>
      )}
      <Dialog
        open={confirm}
        onOpenChange={(o) => {
          if (!busy) setConfirm(o);
        }}
      >
        <DialogContent>
          <DialogTitle>Publish this content?</DialogTitle>
          <DialogDescription>
            The saved campaign, announcement, store information and launch
            signup setting will become public.
          </DialogDescription>
          <div className="order-actions">
            <button
              className="admin-secondary"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Keep private
            </button>
            <button
              className="admin-primary"
              disabled={busy}
              onClick={() => action("publish")}
            >
              Publish content
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
