import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

// The first paint is themed by the inline script in index.html; this module keeps React in sync.
const KEY = 'pttep-theme'
const root = document.documentElement
const listeners = new Set<() => void>()
const read = (): Theme => (root.dataset.theme === 'dark' ? 'dark' : 'light')

function apply(t: Theme) {
  root.dataset.theme = t
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#07111f' : '#e9f4ff')
  listeners.forEach(l => l())
}

/** Explicit choice from the toggle; remembered across visits. */
export function setTheme(t: Theme) {
  try { localStorage.setItem(KEY, t) } catch { /* private mode: still switch for this visit */ }
  apply(t)
}

// Until the user picks one, follow the OS setting live.
const mq = window.matchMedia('(prefers-color-scheme: dark)')
mq.addEventListener('change', e => {
  let saved: string | null = null
  try { saved = localStorage.getItem(KEY) } catch { /* ignore */ }
  if (!saved) apply(e.matches ? 'dark' : 'light')
})

export function useTheme(): Theme {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb) } }, read, () => 'light')
}
