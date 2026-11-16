// Core analytics: parsing, driver statistics and the Bull/Bear logistic model.
// Logic mirrors the verified v1 dashboard (results match the Python prototype).

export type Regime = 'Bull' | 'Bear'
export interface Row {
  Date: string
  PTTEP_Close: number
  Brent_Close: number
  SET_Index: number
  SP500_Close: number
  FX_THB_per_USD: number
  Thailand_10Y_Yield_Pct: number
  Thailand_1Y_Yield_Pct: number
  Regime: Regime
}
type NumKey = Exclude<keyof Row, 'Date' | 'Regime'>
type ChangeType = 'pct' | 'diff'

export interface DriverDef { key: NumKey; name: string; short: string; cat: string; type: ChangeType; unit: string }
export interface DriverStat extends DriverDef {
  last: number; d1: number; d20: number; corr60: number; corrAll: number; beta60: number; impact: number; spark: number[]
}

const REQ = ['Date', 'PTTEP_Close', 'Brent_Close', 'SET_Index', 'SP500_Close', 'FX_THB_per_USD',
  'Thailand_10Y_Yield_Pct', 'Thailand_1Y_Yield_Pct', 'PTTEP_Classification'] as const
const NUM: NumKey[] = ['PTTEP_Close', 'Brent_Close', 'SET_Index', 'SP500_Close', 'FX_THB_per_USD',
  'Thailand_10Y_Yield_Pct', 'Thailand_1Y_Yield_Pct']

export const DRIVERS: DriverDef[] = [
  { key: 'Brent_Close', name: 'Brent crude', short: 'Brent', cat: 'Sector catalyst', type: 'pct', unit: 'USD/bbl' },
  { key: 'SET_Index', name: 'SET Index', short: 'SET', cat: 'Market sentiment', type: 'pct', unit: 'pts' },
  { key: 'SP500_Close', name: 'S&P 500', short: 'S&P 500', cat: 'Global sentiment', type: 'pct', unit: 'pts' },
  { key: 'FX_THB_per_USD', name: 'USD/THB', short: 'USD/THB', cat: 'Macro', type: 'pct', unit: 'THB' },
  { key: 'Thailand_10Y_Yield_Pct', name: 'Thai 10Y yield', short: 'TH 10Y', cat: 'Macro', type: 'diff', unit: '%' },
  { key: 'Thailand_1Y_Yield_Pct', name: 'Thai 1Y yield', short: 'TH 1Y', cat: 'Macro', type: 'diff', unit: '%' },
]
export const FEATURES: { key: NumKey; name: string; type: ChangeType }[] = [
  { key: 'PTTEP_Close', name: 'PTTEP 20D momentum', type: 'pct' },
  { key: 'Brent_Close', name: 'Brent 20D return', type: 'pct' },
  { key: 'SET_Index', name: 'SET 20D return', type: 'pct' },
  { key: 'SP500_Close', name: 'S&P 500 20D return', type: 'pct' },
  { key: 'FX_THB_per_USD', name: 'USD/THB 20D change', type: 'pct' },
  { key: 'Thailand_10Y_Yield_Pct', name: 'Thai 10Y 20D change', type: 'diff' },
  { key: 'Thailand_1Y_Yield_Pct', name: 'Thai 1Y 20D change', type: 'diff' },
]
export const HORIZON = 5, LOOKBACK = 20, WIN = 60, SMA = 50, TRAIN_FRAC = 0.8

export function parseCSV(text: string): Row[] {
  const lines = text.replace(/^﻿/, '').trim().split(/\r?\n/)
  const head = lines[0].split(',').map(s => s.trim())
  const miss = REQ.filter(c => !head.includes(c))
  if (miss.length) throw new Error(`ไฟล์ขาดคอลัมน์: ${miss.join(', ')} ให้ใช้ไฟล์ CSV ที่ได้จาก notebook WS3`)
  const ix: Record<string, number> = Object.fromEntries(head.map((h, i) => [h, i]))
  const rows: Row[] = []
  for (let k = 1; k < lines.length; k++) {
    const f = lines[k].split(',')
    if (f.length < head.length) continue
    const reg = f[ix.PTTEP_Classification].trim()
    if (reg !== 'Bull' && reg !== 'Bear') continue
    const r = { Date: f[ix.Date].trim().slice(0, 10), Regime: reg } as Row
    let ok = true
    for (const c of NUM) { r[c] = parseFloat(f[ix[c]]); if (!Number.isFinite(r[c])) ok = false }
    if (ok) rows.push(r)
  }
  rows.sort((a, b) => (a.Date < b.Date ? -1 : a.Date > b.Date ? 1 : 0))
  if (rows.length < SMA + HORIZON + 30) throw new Error(`มีข้อมูลที่ใช้ได้เพียง ${rows.length} แถว ต้องมีอย่างน้อย ${SMA + HORIZON + 30} แถว`)
  return rows
}

const col = (rows: Row[], k: NumKey) => rows.map(r => r[k])
const change = (a: number[], i: number, lag: number, t: ChangeType) =>
  i - lag < 0 ? NaN : t === 'pct' ? a[i] / a[i - lag] - 1 : a[i] - a[i - lag]
const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length
const std = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)) }
const cov = (a: number[], b: number[]) => { const ma = mean(a), mb = mean(b); let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb); return s / (a.length - 1) }
const corr = (a: number[], b: number[]) => cov(a, b) / (std(a) * std(b))
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))

function auc(y: number[], p: number[]) {
  const idx = p.map((_, i) => i).sort((a, b) => p[a] - p[b])
  const rank = new Array<number>(p.length); idx.forEach((v, r) => (rank[v] = r + 1))
  let P = 0, sr = 0; y.forEach((v, i) => { if (v === 1) { P++; sr += rank[i] } })
  const N = y.length - P; return (sr - P * (P + 1) / 2) / (P * N)
}

export interface Analysis {
  rows: Row[]; n: number; px: number[]; sma: number[]; pRet: number[]; drivers: DriverStat[]
  prob: number[]; w: number[]; b: number; tr: number[]; te: number[]; yTe: number[]; pTe: number[]
  aucTest: number; aucTrain: number; bearRateTest: number; vol20: number; volAll: number; maxDD: number
}

export function analyse(rows: Row[]): Analysis {
  const n = rows.length, last = n - 1
  const px = col(rows, 'PTTEP_Close')
  const sma = px.map((_, i) => (i < SMA - 1 ? NaN : mean(px.slice(i - SMA + 1, i + 1))))
  const pRet = px.map((_, i) => change(px, i, 1, 'pct'))

  const drivers: DriverStat[] = DRIVERS.map(d => {
    const a = col(rows, d.key)
    const dc = a.map((_, i) => change(a, i, 1, d.type))
    const y60 = pRet.slice(n - WIN), x60 = dc.slice(n - WIN)
    const beta60 = cov(y60, x60) / std(x60) ** 2
    return { ...d, last: a[last], d1: dc[last], d20: change(a, last, LOOKBACK, d.type),
      corr60: corr(y60, x60), corrAll: corr(pRet.slice(1), dc.slice(1)), beta60, impact: beta60 * dc[last],
      spark: a.slice(n - WIN) }
  })

  const fcols = FEATURES.map(f => col(rows, f.key))
  const X = rows.map((_, i) => FEATURES.map((f, j) => change(fcols[j], i, LOOKBACK, f.type)))
  const y = rows.map((_, i) => (i + HORIZON < n ? (rows[i + HORIZON].Regime === 'Bear' ? 1 : 0) : null))
  const start = SMA - 1 + HORIZON // skip SMA warm-up rows, which WS3 labels Bear by default
  const featOK = (i: number) => X[i].every(Number.isFinite)
  const labelled: number[] = []
  for (let i = start; i < n; i++) if (y[i] !== null && featOK(i)) labelled.push(i)
  const cut = labelled[Math.floor(labelled.length * TRAIN_FRAC)]
  const tr = labelled.filter(i => i < cut), te = labelled.filter(i => i >= cut)
  const mu = FEATURES.map((_, j) => mean(tr.map(i => X[i][j])))
  const sd = FEATURES.map((_, j) => std(tr.map(i => X[i][j])))
  const Z = X.map(r => r.map((v, j) => (v - mu[j]) / sd[j]))
  const w = new Array<number>(FEATURES.length).fill(0); let b = 0
  const lr = 0.1, lam = 0.01
  for (let it = 0; it < 2000; it++) {
    const g = new Array<number>(FEATURES.length).fill(0); let gb = 0
    for (const i of tr) {
      const e = sigmoid(Z[i].reduce((s, v, j) => s + v * w[j], b)) - (y[i] as number)
      for (let j = 0; j < w.length; j++) g[j] += e * Z[i][j]
      gb += e
    }
    for (let j = 0; j < w.length; j++) w[j] -= lr * (g[j] / tr.length + lam * w[j])
    b -= lr * gb / tr.length
  }
  const prob = rows.map((_, i) => (featOK(i) && i >= SMA - 1 ? sigmoid(Z[i].reduce((s, v, j) => s + v * w[j], b)) : NaN))
  const yTe = te.map(i => y[i] as number), pTe = te.map(i => prob[i])
  const yTr = tr.map(i => y[i] as number), pTr = tr.map(i => prob[i])

  let peak = -Infinity, maxDD = 0
  for (const v of px) { peak = Math.max(peak, v); maxDD = Math.min(maxDD, v / peak - 1) }
  return { rows, n, px, sma, pRet, drivers, prob, w, b, tr, te, yTe, pTe,
    aucTest: auc(yTe, pTe), aucTrain: auc(yTr, pTr), bearRateTest: mean(yTe),
    vol20: std(pRet.slice(n - LOOKBACK)) * Math.sqrt(252), volAll: std(pRet.slice(1)) * Math.sqrt(252), maxDD }
}

export function evaluate(yTrue: number[], p: number[], x: number) {
  let tp = 0, fp = 0, fn = 0, tn = 0
  yTrue.forEach((v, i) => {
    const pr = p[i] >= x ? 1 : 0
    if (pr && v) tp++; else if (pr && !v) fp++; else if (!pr && v) fn++; else tn++
  })
  const prec = tp / Math.max(tp + fp, 1), rec = tp / Math.max(tp + fn, 1)
  return { tp, fp, fn, tn, prec, rec, f1: prec + rec ? 2 * prec * rec / (prec + rec) : 0, acc: (tp + tn) / yTrue.length }
}
