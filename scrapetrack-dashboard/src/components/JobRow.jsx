import { Eye, ExternalLink, Copy, Check, Trash2 } from "lucide-react";
import { useState } from "react";
import StatusBadge from "./StatusBadge";

const JobRow = ({ job, onViewResults, onDelete, index }) => {
  const [copied, setCopied] = useState(false);
  const formattedDate = new Date(job.createdAt).toLocaleString();
  
  const copyId = () => {
    navigator.clipboard.writeText(job._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Truncate URL for display
  const displayUrl = job.url.length > 40 ? job.url.slice(0, 40) + '…' : job.url;

  return (
    <tr 
      className="group transition-colors hover:bg-accent/30"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {job._id.slice(0, 8)}…
          </span>
          <button
            onClick={copyId}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
            title="Copy ID"
          >
            {copied ? (
              <Check className="h-3 w-3 text-status-completed" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        </div>
      </td>
      <td className="px-5 py-4 max-w-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-foreground truncate" title={job.url}>
            {displayUrl}
          </span>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
            title="Open URL"
          >
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        </div>
      </td>
      <td className="px-5 py-4">
        <StatusBadge status={job.status} />
      </td>
      <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
        {formattedDate}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewResults(job)}
            disabled={job.status !== "completed"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-all hover:bg-accent hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View</span>
          </button>
          <button
            onClick={() => onDelete(job._id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-medium text-destructive transition-all hover:bg-destructive/10 hover:border-destructive/30"
            title="Delete job"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default JobRow;
