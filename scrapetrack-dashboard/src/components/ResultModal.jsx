import { X, FileText, AlignLeft, ExternalLink, CheckCircle2, Download, Image, Hash } from "lucide-react";
import { useEffect, useState } from "react";

const ResultModal = ({ job, onClose }) => {
  const [activeTag, setActiveTag] = useState(null);

  const elements = job?.result?.elements || {};
  const tagTypes = Object.keys(elements);

  useEffect(() => {
    if (tagTypes.length > 0 && !activeTag) {
      setActiveTag(tagTypes[0]);
    }
  }, [tagTypes, activeTag]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleDownload = () => {
    const data = {
      url: job.url,
      title: job.result.title,
      metaDescription: job.result.metaDescription,
      elements: job.result.elements,
      totalElements: job.result.totalElements,
      tagTypes: job.result.tagTypes,
      timestamp: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scrape-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!job || !job.result) return null;

  const { title, metaDescription, totalElements } = job.result;

  const renderElement = (tag, item, i) => {
    // Images
    if (tag === 'img' && item.src) {
      return (
        <div
          key={i}
          className="group relative rounded-lg border border-border/50 bg-background overflow-hidden transition-all hover:border-primary/30"
        >
          <a href={item.src} target="_blank" rel="noopener noreferrer">
            <img
              src={item.src}
              alt={item.alt || `Image ${i + 1}`}
              className="w-full h-32 object-cover transition-transform group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden items-center justify-center h-32 bg-muted text-muted-foreground text-xs">
              Failed to load
            </div>
          </a>
          {item.alt && (
            <div className="p-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground truncate" title={item.alt}>{item.alt}</p>
            </div>
          )}
        </div>
      );
    }

    // Links
    if (tag === 'a' && item.href) {
      return (
        <a
          key={i}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-border/50 bg-background p-3 transition-all hover:border-primary/30 hover:bg-primary/5 group"
        >
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
          <div className="min-w-0">
            {item.text && <p className="text-sm font-medium text-card-foreground truncate">{item.text}</p>}
            <p className="text-xs text-muted-foreground truncate">{item.href}</p>
          </div>
        </a>
      );
    }

    // Tables
    if (tag === 'table' && item.rows) {
      return (
        <div key={i} className="rounded-lg border border-border/50 bg-background overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {item.rows.map((row, ri) => (
                <tr key={ri} className={ri === 0 ? "bg-muted/40 font-medium" : "border-t border-border/30"}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-card-foreground">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Form elements
    if (tag === 'input' || tag === 'select' || tag === 'textarea') {
      return (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 bg-background p-3 transition-all hover:border-primary/30 hover:bg-primary/5">
          <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-500">{item.type || tag}</span>
          <div className="min-w-0">
            {item.name && <p className="text-sm font-medium text-card-foreground">{item.name}</p>}
            {item.placeholder && <p className="text-xs text-muted-foreground">{item.placeholder}</p>}
          </div>
        </div>
      );
    }

    // Forms
    if (tag === 'form') {
      return (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 bg-background p-3 transition-all hover:border-primary/30 hover:bg-primary/5">
          <span className="rounded bg-purple-500/10 px-2 py-0.5 text-xs font-bold uppercase text-purple-500">{item.method || 'GET'}</span>
          <p className="text-sm text-card-foreground truncate">{item.action || '/'}</p>
        </div>
      );
    }

    // Iframes / video / audio with src
    if (item.src) {
      return (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 bg-background p-3 transition-all hover:border-primary/30 hover:bg-primary/5">
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            {item.text && <p className="text-sm text-card-foreground truncate">{item.text}</p>}
            <p className="text-xs text-muted-foreground truncate">{item.src}</p>
          </div>
        </div>
      );
    }

    // Default: text content
    if (item.text) {
      return (
        <div
          key={i}
          className="rounded-lg border border-border/50 bg-background p-4 transition-all hover:border-primary/30 hover:bg-primary/5"
        >
          <p className="text-sm leading-relaxed text-card-foreground break-words">{item.text}</p>
        </div>
      );
    }

    return null;
  };

  const activeItems = activeTag ? (elements[activeTag] || []) : [];
  const isImageTag = activeTag === 'img';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-md">
      <div className="mx-4 w-full max-w-3xl scale-in overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
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
                  <span className="text-xs text-muted-foreground">
                    {totalElements} elements / {tagTypes.length} tags
                  </span>
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

        {/* Tag Tabs - scrollable */}
        <div className="flex overflow-x-auto border-b border-border bg-muted/20 px-6 gap-1 scrollbar-thin">
          {tagTypes.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px shrink-0 ${
                activeTag === tag
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Hash className="h-3 w-3" />
              {tag}
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px]">
                {elements[tag].length}
              </span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {/* Title & Meta */}
          <div className="group rounded-xl border border-border bg-muted/20 p-5 transition-all hover:border-primary/20 mb-4">
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

          <div className="group rounded-xl border border-border bg-muted/20 p-5 transition-all hover:border-primary/20 mb-4">
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

          {/* Active Tag Section Header */}
          {activeTag && (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Hash className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  &lt;{activeTag}&gt; elements
                </span>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {activeItems.length}
              </span>
            </div>
          )}

          {/* Elements */}
          {activeItems.length > 0 ? (
            <div className={isImageTag ? "grid grid-cols-2 sm:grid-cols-3 gap-4" : "space-y-3"}>
              {activeItems.map((item, i) => renderElement(activeTag, item, i))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No elements found for this tag.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-border bg-muted/20 px-6 py-4">
          <button
            onClick={handleDownload}
            className="rounded-lg border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
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
