import { Loader2, Inbox, Search } from "lucide-react";
import JobRow from "./JobRow";

const JobTable = ({ jobs, isLoading, onViewResults, onDelete }) => {
  if (isLoading && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-20 shadow-sm">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-primary" />
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">Loading jobs…</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
          <Search className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="mt-4 text-base font-medium text-foreground">No scraping jobs yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit a URL above to start your first job
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Job ID
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                URL
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Created
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.map((job, index) => (
              <JobRow key={job._id} job={job} onViewResults={onViewResults} onDelete={onDelete} index={index} />
            ))}
          </tbody>
        </table>
      </div>
      {isLoading && (
        <div className="flex items-center justify-center border-t border-border bg-muted/20 py-3">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <span className="ml-2 text-xs font-medium text-muted-foreground">Syncing…</span>
        </div>
      )}
    </div>
  );
};

export default JobTable;
