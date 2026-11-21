// Core analytics: parsing, driver statistics, and the Bull/Bear model results from Dataiku (WS4).
// The model is not run here: P(Bear) comes from the Dataiku LightGBM score recipe (proba_Bear),
// and the test set is the 258 rows Dataiku held out (Q2_LightGBM_test_predicted.csv).

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
  pBear: number
}
type NumKey = Exclude<keyof Row, 'Date' | 'Regime' | 'pBear'>
type ChangeType = 'pct' | 'diff'

export interface DriverDef { key: NumKey; name: string; short: string; cat: string; type: ChangeType; unit: string }
export interface DriverStat extends DriverDef {
  last: number; d1: number; d20: number; corr60: number; corrAll: number; beta60: number; impact: number; spark: number[]
}

const REQ = ['Date', 'PTTEP_Close', 'Brent_Close', 'SET_Index', 'SP500_Close', 'FX_THB_per_USD',
  'Thailand_10Y_Yield_Pct', 'Thailand_1Y_Yield_Pct', 'PTTEP_Classification', 'proba_Bear'] as const
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
export const LOOKBACK = 20, WIN = 60, SMA = 50

// Q2 LightGBM feature importance (Shapley) as shown in Dataiku: Report → Feature importance.
export const DATAIKU_IMPORTANCE: { key: string; name: string; pct: number }[] = [
  { key: 'PTTEP_Close', name: 'ราคาปิด PTTEP', pct: 28 },
  { key: 'Brent_Close', name: 'น้ำมันดิบ Brent', pct: 21 },
  { key: 'SP500_Close', name: 'S&P 500', pct: 10 },
  { key: 'Thailand_1Y_Yield_Pct', name: 'พันธบัตรไทย 1 ปี', pct: 10 },
  { key: 'THBUSD_Close', name: 'THB/USD', pct: 9 },
  { key: 'Thailand_10Y_Yield_Pct', name: 'พันธบัตรไทย 10 ปี', pct: 9 },
  { key: 'SET_Index', name: 'ดัชนี SET', pct: 8 },
  { key: 'FX_THB_per_USD', name: 'USD/THB', pct: 4 },
]

export function parseCSV(text: string): Row[] {
  const lines = text.replace(/^﻿/, '').trim().split(/\r?\n/)
  const head = lines[0].split(',').map(s => s.trim())
  const miss = REQ.filter(c => !head.includes(c))
  if (miss.length) throw new Error(`ไฟล์ขาดคอลัมน์: ${miss.join(', ')} ให้ใช้ไฟล์ CSV ที่ score จาก Dataiku (มีคอลัมน์ proba_Bear)`)
  const ix: Record<string, number> = Object.fromEntries(head.map((h, i) => [h, i]))
  const rows: Row[] = []
  for (let k = 1; k < lines.length; k++) {
    const f = lines[k].split(',')
    if (f.length < head.length) continue
    const reg = f[ix.PTTEP_Classification].trim()
    if (reg !== 'Bull' && reg !== 'Bear') continue
    const r = { Date: f[ix.Date].trim().slice(0, 10), Regime: reg, pBear: parseFloat(f[ix.proba_Bear]) } as Row
    let ok = Number.isFinite(r.pBear)
    for (const c of NUM) { r[c] = parseFloat(f[ix[c]]); if (!Number.isFinite(r[c])) ok = false }
    if (ok) rows.push(r)
  }
  rows.sort((a, b) => (a.Date < b.Date ? -1 : a.Date > b.Date ? 1 : 0))
  if (rows.length < SMA + 30) throw new Error(`มีข้อมูลที่ใช้ได้เพียง ${rows.length} แถว ต้องมีอย่างน้อย ${SMA + 30} แถว`)
  return rows
}

const col = (rows: Row[], k: NumKey) => rows.map(r => r[k])
const change = (a: number[], i: number, lag: number, t: ChangeType) =>
  i - lag < 0 ? NaN : t === 'pct' ? a[i] / a[i - lag] - 1 : a[i] - a[i - lag]
const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length
const std = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)) }
const cov = (a: number[], b: number[]) => { const ma = mean(a), mb = mean(b); let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb); return s / (a.length - 1) }
const corr = (a: number[], b: number[]) => cov(a, b) / (std(a) * std(b))

function auc(y: number[], p: number[]) {
  const idx = p.map((_, i) => i).sort((a, b) => p[a] - p[b])
  const rank = new Array<number>(p.length); idx.forEach((v, r) => (rank[v] = r + 1))
  let P = 0, sr = 0; y.forEach((v, i) => { if (v === 1) { P++; sr += rank[i] } })
  const N = y.length - P; return (sr - P * (P + 1) / 2) / (P * N)
}

export interface Analysis {
  rows: Row[]; n: number; px: number[]; sma: number[]; pRet: number[]; drivers: DriverStat[]
  prob: number[]; tr: number[]; te: number[]; yTe: number[]; pTe: number[]
  aucTest: number; aucTrain: number; bearRateTest: number; vol20: number; volAll: number; maxDD: number
}

/** testDates: the rows Dataiku held out as its test set. */
export function analyse(rows: Row[], testDates: Set<string>): Analysis {
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

  // Dataiku predicts the same-day regime; its test set is a random sample of rows.
  const prob = rows.map(r => r.pBear)
  const y = rows.map(r => (r.Regime === 'Bear' ? 1 : 0))
  const te = rows.map((_, i) => i).filter(i => testDates.has(rows[i].Date))
  const tr = rows.map((_, i) => i).filter(i => !testDates.has(rows[i].Date))
  const yTe = te.map(i => y[i]), pTe = te.map(i => prob[i])
  const yTr = tr.map(i => y[i]), pTr = tr.map(i => prob[i])

  let peak = -Infinity, maxDD = 0
  for (const v of px) { peak = Math.max(peak, v); maxDD = Math.min(maxDD, v / peak - 1) }
  return { rows, n, px, sma, pRet, drivers, prob, tr, te, yTe, pTe,
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
