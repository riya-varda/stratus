import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '—'
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const FRAMEWORKS = [
  'Next.js',
  'Remix',
  'Vite',
  'Create React App',
  'Nuxt',
  'SvelteKit',
  'Astro',
  'Django',
  'FastAPI',
  'Express',
  'NestJS',
  'Laravel',
  'Rails',
  'Other',
]

export const STATUS_COLORS = {
  success: 'text-emerald-500',
  failed: 'text-red-500',
  pending: 'text-yellow-500',
  building: 'text-blue-500',
  deploying: 'text-indigo-500',
  cancelled: 'text-gray-400',
  active: 'text-emerald-500',
  archived: 'text-gray-400',
  deleted: 'text-red-500',
} as const

export const STATUS_BG = {
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  failed: 'bg-red-500/10 text-red-600 dark:text-red-400',
  pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  building: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  deploying: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  cancelled: 'bg-gray-500/10 text-gray-500',
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  archived: 'bg-gray-500/10 text-gray-500',
} as const

export const ENV_COLORS = {
  production: 'bg-red-500/10 text-red-600 dark:text-red-400',
  staging: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  development: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
} as const
