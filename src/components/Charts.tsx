import { useEffect, useRef } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import type { Analysis } from '../lib/analytics'
import { C } from '../lib/format'

const ts = (d: string) => Date.parse(d + 'T00:00:00Z') / 1000
const axis = (o: Partial<uPlot.Axis> = {}): uPlot.Axis => ({
  stroke: C.muted, font: '11px "IBM Plex Mono", monospace',
  grid: { stroke: 'rgba(11,31,68,0.08)', width: 1 }, ticks: { stroke: 'rgba(11,31,68,0.15)', width: 1, size: 4 },
  ...o,
})

/** Mounts a uPlot instance and keeps it sized to its container. */
function useUPlot(make: (w: number, h: number) => { opts: uPlot.Options; data: uPlot.AlignedData }, deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const { opts, data } = make(el.clientWidth, el.clientHeight)
    const u = new uPlot(opts, data, el)
    const ro = new ResizeObserver(() => u.setSize({ width: el.clientWidth, height: el.clientHeight }))
    ro.observe(el)
    return () => { ro.disconnect(); u.destroy() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

export function PriceChart({ A, range }: { A: Analysis; range: number }) {
  const ref = useUPlot((width, height) => {
    const s = range ? Math.max(0, A.n - range) : 0
    const rows = A.rows.slice(s)
    const x = rows.map(r => ts(r.Date))
    const regimeBands: uPlot.Plugin = {
      hooks: {
        drawClear: [u => {
          const { ctx } = u, top = u.bbox.top, h = u.bbox.height
          let i = 0
          while (i < rows.length) {
            let j = i; while (j + 1 < rows.length && rows[j + 1].Regime === rows[i].Regime) j++
            const x0 = u.valToPos(x[i], 'x', true), x1 = u.valToPos(x[Math.min(j + 1, rows.length - 1)], 'x', true)
            ctx.fillStyle = rows[i].Regime === 'Bull' ? 'rgba(16,185,129,0.13)' : 'rgba(239,59,54,0.13)'
            ctx.fillRect(x0, top, Math.max(x1 - x0, 1), h)
            i = j + 1
          }
        }],
      },
    }
    return {
      data: [x, A.px.slice(s), A.sma.slice(s).map(v => (Number.isFinite(v) ? v : null))] as uPlot.AlignedData,
      opts: {
        width, height, plugins: [regimeBands], legend: { show: false }, cursor: { y: false, points: { size: 7 } },
        scales: { x: { time: true } },
        axes: [axis(), axis({ side: 1, size: 54, values: (_u, v) => v.map(n => n.toFixed(0)) })],
        series: [
          {},
          { label: 'PTTEP close', stroke: C.blue, width: 2.2,
            fill: (u: uPlot) => { const g = u.ctx.createLinearGradient(0, u.bbox.top, 0, u.bbox.top + u.bbox.height)
              g.addColorStop(0, 'rgba(31,111,224,0.28)'); g.addColorStop(1, 'rgba(18,181,239,0)'); return g } },
          { label: 'SMA50', stroke: C.amber, width: 1.8, dash: [6, 5] },
        ],
      },
    }
  }, [A, range])
  return <div className="chart" ref={ref} role="img" aria-label="ราคาปิด PTTEP พร้อมเส้น SMA 50 วัน และแถบสี Bull/Bear" />
}

export function ProbChart({ A, threshold }: { A: Analysis; threshold: number }) {
  const ref = useUPlot((width, height) => {
    const x = A.rows.map(r => ts(r.Date))
    const nul = (v: number) => (Number.isFinite(v) ? v : null)
    const isTest = new Set(A.te)
    return {
      data: [x, A.prob.map(nul), A.prob.map((v, i) => (isTest.has(i) ? nul(v) : null)),
        x.map(() => threshold)] as uPlot.AlignedData,
      opts: {
        width, height, legend: { show: false }, cursor: { y: false },
        scales: { x: { time: true }, y: { range: [0, 1] } },
        axes: [axis(), axis({ side: 1, size: 48, values: (_u, v) => v.map(n => `${Math.round(n * 100)}%`) })],
        series: [{},
          { label: 'All days', stroke: 'rgba(74,97,133,0.55)', width: 1.1 },
          { label: 'Dataiku test rows', stroke: C.red, width: 0, paths: () => null, points: { show: true, size: 5, fill: C.red } },
          { label: 'Threshold', stroke: C.amber, width: 1.8, dash: [7, 5] }],
      },
    }
  }, [A, threshold])
  return <div className="chart short" ref={ref} role="img" aria-label="ความน่าจะเป็นที่จะเป็น Bear ตามเวลา เทียบกับเกณฑ์ที่เลือก" />
}

/** Inline SVG sparkline for driver cards. */
export function Spark({ values, color }: { values: number[]; color: string }) {
  const w = 120, h = 34, min = Math.min(...values), max = Math.max(...values), span = max - min || 1
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / span) * (h - 4) - 2}`).join(' ')
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
