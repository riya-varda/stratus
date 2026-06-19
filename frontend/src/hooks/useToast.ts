import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

let toastIdCounter = 0

// Simple global toast state — a lightweight alternative to the full shadcn/ui toast hook
const listeners: Set<(toasts: Toast[]) => void> = new Set()
let toasts: Toast[] = []

function notify(toast: Omit<Toast, 'id'>) {
  const id = String(++toastIdCounter)
  const t = { ...toast, id }
  toasts = [...toasts, t]
  listeners.forEach((l) => l(toasts))
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== id)
    listeners.forEach((l) => l(toasts))
  }, 4000)
}

export function toast(opts: Omit<Toast, 'id'>) {
  notify(opts)
}

export function useToasts() {
  const [state, setState] = useState<Toast[]>(toasts)

  useState(() => {
    listeners.add(setState)
    return () => listeners.delete(setState)
  })

  return state
}
