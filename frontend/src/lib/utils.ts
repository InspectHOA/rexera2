import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(date);
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    awaiting_review: 'bg-yellow-100 text-yellow-800',
    blocked: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };
  
  return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: string): string {
  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };
  
  return priorityColors[priority.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

export function getAgentColor(agentType: string): string {
  const agentColors: Record<string, string> = {
    nina: 'bg-purple-100 text-purple-800',
    mia: 'bg-emerald-100 text-emerald-800',
    florian: 'bg-orange-100 text-orange-800',
    rex: 'bg-teal-100 text-teal-800',
    iris: 'bg-pink-100 text-pink-800',
    ria: 'bg-sky-100 text-sky-800',
    kosha: 'bg-lime-100 text-lime-800',
    cassy: 'bg-red-100 text-red-800',
    max: 'bg-violet-100 text-violet-800',
    corey: 'bg-blue-100 text-blue-800',
  };
  
  return agentColors[agentType.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

export function getWorkflowTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    MUNI_LIEN_SEARCH: 'Municipal Lien Search',
    HOA_ACQUISITION: 'HOA Acquisition',
    PAYOFF: 'Payoff Request',
  };
  
  return labels[type] || type;
}

export function getAgentIcon(agentType: string): string {
  const icons: Record<string, string> = {
    nina: '🔍',
    mia: '📧',
    florian: '🗣️',
    rex: '🌐',
    iris: '📄',
    ria: '👩‍💼',
    kosha: '💰',
    cassy: '✓',
    max: '📞',
    corey: '🏢',
  };
  
  return icons[agentType.toLowerCase()] || '🤖';
}

export function calculateSLAStatus(dueDate: string, currentDate: Date = new Date()): {
  status: 'on_time' | 'at_risk' | 'breached';
  timeRemaining: string;
} {
  const due = new Date(dueDate);
  const diffMs = due.getTime() - currentDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  let status: 'on_time' | 'at_risk' | 'breached';
  if (diffMs < 0) {
    status = 'breached';
  } else if (diffHours < 4) {
    status = 'at_risk';
  } else {
    status = 'on_time';
  }
  
  const absDiffMs = Math.abs(diffMs);
  const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  let timeRemaining: string;
  if (diffMs < 0) {
    if (days > 0) {
      timeRemaining = `${days}d overdue`;
    } else if (hours > 0) {
      timeRemaining = `${hours}h overdue`;
    } else {
      timeRemaining = `${minutes}m overdue`;
    }
  } else {
    if (days > 0) {
      timeRemaining = `${days}d ${hours}h`;
    } else if (hours > 0) {
      timeRemaining = `${hours}h ${minutes}m`;
    } else {
      timeRemaining = `${minutes}m`;
    }
  }
  
  return { status, timeRemaining };
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}