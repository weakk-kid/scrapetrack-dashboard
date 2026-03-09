import { X, FileText, Link2, AlignLeft, ExternalLink, CheckCircle2, Download, Image } from "lucide-react";
import { useEffect, useState } from "react";

const ResultModal = ({ job, onClose }) => {
  const [activeTab, setActiveTab] = useState('content');

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
      paragraphs: job.result.paragraphs,
      images: job.result.images,
      timestamp: new Date().toISOString(),
      totalParagraphs: job.result.paragraphs?.length || 0,
      totalImages: job.result.images?.length || 0
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

  const { title, metaDescription, paragraphs, images } = job.result;

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

        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/20 px-6">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'content'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlignLeft className="h-4 w-4" />
            Content
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
              {paragraphs?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'images'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Image className="h-4 w-4" />
            Images
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
              {images?.length || 0}
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {/* Title */}
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

          {/* Meta Description */}
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

          {/* Content Tab */}
          {activeTab === 'content' && (
            <>
              {/* Paragraphs Section Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <AlignLeft className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Extracted Content
                  </span>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {paragraphs?.length || 0}
                </span>
              </div>

              {/* Paragraphs Grid */}
              {paragraphs && paragraphs.length > 0 ? (
                <div className="space-y-3">
                  {paragraphs.map((para, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border/50 bg-background p-4 transition-all hover:border-primary/30 hover:bg-primary/5"
                    >
                      <p className="text-sm leading-relaxed text-card-foreground break-words">
                        {para}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No paragraphs extracted.</p>
              )}
            </>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <>
              {/* Images Section Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <Image className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Extracted Images
                  </span>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {images?.length || 0}
                </span>
              </div>

              {/* Images Grid */}
              {images && images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="group relative rounded-lg border border-border/50 bg-background overflow-hidden transition-all hover:border-primary/30"
                    >
                      <a href={img.src} target="_blank" rel="noopener noreferrer">
                        <img
                          src={img.src}
                          alt={img.alt || `Image ${i + 1}`}
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
                      {img.alt && (
                        <div className="p-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground truncate" title={img.alt}>
                            {img.alt}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No images found on this page.</p>
              )}
            </>
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
