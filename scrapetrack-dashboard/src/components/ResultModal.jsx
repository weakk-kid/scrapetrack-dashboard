import { X, FileText, Link2, AlignLeft, ExternalLink, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

const ResultModal = ({ job, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!job || !job.result) return null;

  const { title, metaDescription, links } = job.result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-md">
      <div className="mx-4 w-full max-w-2xl scale-in overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-border px-6 py-5">
          <div className="absolute inset-0 gradient-header opacity-50" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-completed/10">
                <CheckCircle2 className="h-6 w-6 text-status-completed" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Scraping Results</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground truncate max-w-[300px]">{job.url}</span>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
          {/* Title */}
          <div className="group rounded-xl border border-border bg-muted/20 p-5 transition-all hover:border-primary/20">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Page Title
              </span>
            </div>
            <p className="text-sm font-medium text-card-foreground leading-relaxed">
              {title || "N/A"}
            </p>
          </div>

          {/* Meta Description */}
          <div className="group rounded-xl border border-border bg-muted/20 p-5 transition-all hover:border-primary/20">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <AlignLeft className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Meta Description
              </span>
            </div>
            <p className="text-sm text-card-foreground/90 leading-relaxed">
              {metaDescription || "N/A"}
            </p>
          </div>

          {/* Links */}
          <div className="group rounded-xl border border-border bg-muted/20 p-5 transition-all hover:border-primary/20">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Extracted Links
                </span>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {links?.length || 0}
              </span>
            </div>
            {links && links.length > 0 ? (
              <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                {links.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link flex items-center gap-2 truncate rounded-lg px-3 py-2 font-mono text-xs text-primary transition-colors hover:bg-primary/10"
                    >
                      <span className="truncate flex-1">{link}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No links extracted.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-border bg-muted/20 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-primary/30"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
