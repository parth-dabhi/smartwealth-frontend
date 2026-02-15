import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: unknown): string {
  const numericAmount = Number(amount);
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(safeAmount);
}

export function formatPercentage(value: unknown, decimals = 2): string {
  if (value === null || value === undefined || value === '') return '-';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.includes('%')) return trimmed;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return '-';
    return `${parsed >= 0 ? '+' : ''}${parsed.toFixed(decimals)}%`;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '-';
  return `${numericValue >= 0 ? '+' : ''}${numericValue.toFixed(decimals)}%`;
}

export function formatDate(date: string | Date): string {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    console.warn('[formatDate] Invalid date value:', date);
    return '-';
  }
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
}

export function formatDateTime(date: string | Date): string {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    console.warn('[formatDateTime] Invalid date value:', date);
    return '-';
  }
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate);
}

export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function calculateDaysUntil(targetDate: string | Date): number {
  const target = new Date(targetDate);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SUCCESS: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    VERIFIED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    ACTIVE: 'bg-blue-100 text-blue-800',
    PAUSED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
    SUSPENDED: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-green-100 text-green-800',
    ALLOTTED: 'bg-green-100 text-green-800',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}
