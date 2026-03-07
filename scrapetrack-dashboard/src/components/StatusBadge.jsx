import { Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";

const statusConfig = {
  pending: {
    bg: "bg-status-pending-bg border-status-pending/30",
    text: "text-status-pending",
    icon: Clock,
    animate: false,
  },
  running: {
    bg: "bg-status-running-bg border-status-running/30",
    text: "text-status-running",
    icon: Loader2,
    animate: true,
  },
  completed: {
    bg: "bg-status-completed-bg border-status-completed/30",
    text: "text-status-completed",
    icon: CheckCircle2,
    animate: false,
  },
  failed: {
    bg: "bg-status-failed-bg border-status-failed/30",
    text: "text-status-failed",
    icon: XCircle,
    animate: false,
  },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${config.bg} ${config.text}`}
    >
      <Icon className={`h-3 w-3 ${config.animate ? 'animate-spin' : ''}`} />
      {status}
    </span>
  );
};

export default StatusBadge;
