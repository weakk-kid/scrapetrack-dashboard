import { useState, useEffect, useCallback } from "react";
import { Activity, CheckCircle2, Zap, Clock, TrendingUp, Sparkles } from "lucide-react";
import UrlInput from "../components/UrlInput";
import JobTable from "../components/JobTable";
import ResultModal from "../components/ResultModal";
import { createJob, fetchJobs, fetchJobById } from "../services/api";

const POLL_INTERVAL = 3000;

const Dashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [toast, setToast] = useState(null);

  const loadJobs = useCallback(async () => {
    try {
      const data = await fetchJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      // silently fail on poll
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadJobs]);

  const handleSubmit = async (url) => {
    setIsSubmitting(true);
    try {
      await createJob(url);
      showToast("Job submitted successfully!");
      await loadJobs();
    } catch {
      showToast("Failed to submit job. Is the backend running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewResults = async (job) => {
    try {
      const fullJob = await fetchJobById(job._id);
      setSelectedJob(fullJob);
    } catch {
      setSelectedJob(job);
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const stats = {
    total: jobs.length,
    running: jobs.filter((j) => j.status === "running").length,
    completed: jobs.filter((j) => j.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-border bg-card">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 gradient-header opacity-50" />
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl gradient-primary glow-sm">
              <Activity className="h-6 w-6 text-white" />
              <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-completed">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                ScrapeTrack
              </h1>
              <p className="text-sm text-muted-foreground">Distributed Web Scraping Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-status-completed/30 bg-status-completed-bg px-4 py-2 text-xs font-semibold text-status-completed sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-completed opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-status-completed" />
              </span>
              Live Sync
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 fade-in-up">
          <StatCard 
            label="Total Jobs" 
            value={stats.total} 
            icon={TrendingUp}
            iconBg="bg-primary/10"
            iconColor="text-primary"
          />
          <StatCard
            label="Running"
            value={stats.running}
            accent="text-status-running"
            icon={Zap}
            iconBg="bg-status-running/10"
            iconColor="text-status-running"
            pulse={stats.running > 0}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            accent="text-status-completed"
            icon={CheckCircle2}
            iconBg="bg-status-completed/10"
            iconColor="text-status-completed"
          />
        </div>

        <UrlInput onSubmit={handleSubmit} isLoading={isSubmitting} />

        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-4 w-4" />
              Recent Jobs
            </h2>
            <span className="text-xs text-muted-foreground">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} total
            </span>
          </div>
          <JobTable
            jobs={jobs}
            isLoading={isLoading}
            onViewResults={handleViewResults}
          />
        </div>
      </main>

      {/* Result Modal */}
      {selectedJob && (
        <ResultModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-status-completed/30 bg-card px-5 py-4 shadow-lg glow-sm scale-in">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-status-completed/10">
            <CheckCircle2 className="h-4 w-4 text-status-completed" />
          </div>
          <span className="text-sm font-medium text-card-foreground">{toast}</span>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, accent = "text-foreground", icon: Icon, iconBg, iconColor, pulse }) => (
  <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all-smooth hover:shadow-md hover:border-primary/20">
    {/* Subtle hover gradient */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity gradient-header" />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`mt-2 text-3xl font-bold tracking-tight ${accent}`}>{value}</p>
      </div>
      {Icon && (
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg} ${pulse ? 'pulse-glow' : ''}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      )}
    </div>
  </div>
);

export default Dashboard;
