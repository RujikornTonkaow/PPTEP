import { useTheme, type Theme } from './theme'

export const fmt = (v: number, d = 2) =>
  Number.isFinite(v) ? v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—'
export const pct = (v: number, d = 2) => (Number.isFinite(v) ? `${v >= 0 ? '+' : '−'}${Math.abs(v * 100).toFixed(d)}%` : '—')
export const pp = (v: number, d = 3) => (Number.isFinite(v) ? `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(d)} pp` : '—')
export const tone = (v: number) => (!Number.isFinite(v) || Math.abs(v) < 1e-9 ? 'flat' : v > 0 ? 'up' : 'down')
/** Thai month names with Gregorian years, e.g. "10 พ.ย. 2026". */
export const thDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('th-TH-u-ca-gregory', { day: 'numeric', month: 'short', year: 'numeric' })

// Colour tokens shared by canvas/WebGL drawing (keep in sync with the :root tokens in styles.css)
const LIGHT = {
  ink: '#0b1f44', muted: '#4a6185', line: 'rgba(11,31,68,0.10)', grid: 'rgba(11,31,68,0.08)', tick: 'rgba(11,31,68,0.15)',
  blue: '#1f6fe0', cyan: '#12b5ef', red: '#ef3b36', green: '#10b981', amber: '#f59e0b', grey: '#94a3b8',
  allDays: 'rgba(74,97,133,0.55)', fillTop: 'rgba(31,111,224,0.28)', fillBottom: 'rgba(18,181,239,0)',
  bandBull: 'rgba(16,185,129,0.13)', bandBear: 'rgba(239,59,54,0.13)',
  gaugeMid: '#dbe7f7', hub: '#fff',
  weak: '#c3d2e8', ribbonBase: '#ffffff', floor: '#ffffff', floorOpacity: 0.28,
}
const DARK: typeof LIGHT = {
  ink: '#e6eefc', muted: '#9fb2d0', line: 'rgba(210,225,250,0.12)', grid: 'rgba(210,225,250,0.08)', tick: 'rgba(210,225,250,0.18)',
  blue: '#5b9bff', cyan: '#38c6f4', red: '#ff6b66', green: '#34d399', amber: '#fbbf24', grey: '#64748b',
  allDays: 'rgba(159,178,208,0.6)', fillTop: 'rgba(91,155,255,0.32)', fillBottom: 'rgba(56,198,244,0)',
  bandBull: 'rgba(52,211,153,0.15)', bandBear: 'rgba(255,107,102,0.15)',
  gaugeMid: '#2a3a58', hub: '#07111f',
  weak: '#3a4a66', ribbonBase: '#0c1830', floor: '#9fb2d0', floorOpacity: 0.08,
}
export type Palette = typeof LIGHT
export const palette = (t: Theme): Palette => (t === 'dark' ? DARK : LIGHT)
/** Current palette; components re-render (and charts redraw) when the theme changes. */
export const useC = () => palette(useTheme())
