import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return 'N/A';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds == null) return 'N/A';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function timeAgo(date: Date | number | null | undefined): string {
  if (!date) return 'Never';
  const d = date instanceof Date ? date : new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function formatDate(date: Date | number | null | undefined): string {
  if (!date) return 'Never';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString();
}

export function getOsIcon(osClass: string | null | undefined): string {
  switch (osClass?.toLowerCase()) {
    case 'windows10': return '🪟';
    case 'windows11': return '🪟';
    case 'windowsserver': return '🖥️';
    default: return '💻';
  }
}

export function truncate(str: string | null | undefined, length: number): string {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '…' : str;
}
