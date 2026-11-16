export const fmt = (v: number, d = 2) =>
  Number.isFinite(v) ? v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—'
export const pct = (v: number, d = 2) => (Number.isFinite(v) ? `${v >= 0 ? '+' : '−'}${Math.abs(v * 100).toFixed(d)}%` : '—')
export const pp = (v: number, d = 3) => (Number.isFinite(v) ? `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(d)} pp` : '—')
export const tone = (v: number) => (!Number.isFinite(v) || Math.abs(v) < 1e-9 ? 'flat' : v > 0 ? 'up' : 'down')
/** Thai month names with Gregorian years, e.g. "10 พ.ย. 2026". */
export const thDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('th-TH-u-ca-gregory', { day: 'numeric', month: 'short', year: 'numeric' })

// Colour tokens shared by canvas/WebGL drawing (keep in sync with styles.css)
export const C = {
  ink: '#0b1f44', muted: '#4a6185', line: 'rgba(11,31,68,0.10)',
  blue: '#1f6fe0', cyan: '#12b5ef', red: '#ef3b36', green: '#10b981', amber: '#f59e0b', grey: '#94a3b8',
}
