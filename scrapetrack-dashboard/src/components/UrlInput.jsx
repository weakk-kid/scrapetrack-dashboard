import { useState } from "react";
import { Globe, ArrowRight, Loader2, Link2 } from "lucide-react";

const UrlInput = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit(url.trim());
    setUrl("");
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all-smooth fade-in-up ${
      isFocused ? 'border-primary/50 shadow-md glow-sm' : 'border-border'
    }`}>
      {/* Background gradient on focus */}
      <div className={`absolute inset-0 gradient-header transition-opacity ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className="relative">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">New Scraping Job</h2>
            <p className="text-xs text-muted-foreground">Enter a URL to extract content</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Link2 className={`h-4 w-4 transition-colors ${isFocused ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="https://example.com"
              required
              className="h-12 w-full rounded-lg border border-input bg-background pl-11 pr-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all-smooth"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="group inline-flex h-12 items-center gap-2 rounded-lg gradient-primary px-6 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            )}
            <span>Start Scraping</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default UrlInput;
