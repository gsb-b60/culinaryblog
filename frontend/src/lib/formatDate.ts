import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function formatDate(iso: string, pattern = 'dd MMM yyyy'): string {
  return format(parseISO(iso), pattern)
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}
