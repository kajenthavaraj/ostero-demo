import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export function formatRelativeTime(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

export function formatDate(timestamp: string): string {
  try {
    return format(new Date(timestamp), 'MMM d, yyyy')
  } catch {
    return 'Invalid date'
  }
}

export function formatDateTime(timestamp: string): string {
  try {
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a')
  } catch {
    return 'Invalid date'
  }
}

// Application progress calculation - matches EXACTLY with the form's calculation
export function calculateProgress(application: any): number {
  if (application.completed) return 100
  
  // This matches the form's getFilledQuestionsCount function EXACTLY
  let filledCount = 0;
  const totalQuestions = 12; // Same as form
  
  // Count filled fields - EXACT same logic as form
  if (application.full_legal_name?.trim()) filledCount++;
  if (application.email?.trim()) filledCount++;
  if (application.phone?.trim()) filledCount++;
  if (application.date_of_birth) filledCount++;
  if (application.what_looking_to_do?.trim()) filledCount++;
  if (application.loan_amount_requested?.trim()) filledCount++;
  if (application.property_address?.trim()) filledCount++;
  if (application.property_value?.trim()) filledCount++;
  if (application.mortgage_balance?.trim()) filledCount++;
  if (application.property_use?.trim()) filledCount++;
  if (application.employment_type?.trim()) filledCount++;
  if (application.annual_income?.trim()) filledCount++;
  
  return Math.round((filledCount / totalQuestions) * 100);
}

// Call duration formatting
export function formatCallDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return `${hours}h ${remainingMinutes}m`
}

// Currency formatting
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '$0'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num)
}

// Phone number formatting
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/)
  
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`
  }
  
  return phone
}

// Status badge variants
export function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'destructive' {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'ended':
      return 'success'
    case 'in progress':
    case 'in-progress':
    case 'ringing':
      return 'warning'
    case 'failed':
    case 'cancelled':
      return 'destructive'
    default:
      return 'default'
  }
}

// Truncate text
export function truncate(text: string, length: number = 50): string {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

// Generate initials from name
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0).toUpperCase() || ''
  const last = lastName?.charAt(0).toUpperCase() || ''
  return `${first}${last}` || '??'
}

// Debounce function for search
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}