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
    const x = A.rows.map(r => ts(r.Date)), cut = A.te[0]
    const nul = (v: number) => (Number.isFinite(v) ? v : null)
    const testShade: uPlot.Plugin = {
      hooks: {
        drawClear: [u => {
          const x0 = u.valToPos(x[cut], 'x', true)
          u.ctx.fillStyle = 'rgba(239,59,54,0.07)'
          u.ctx.fillRect(x0, u.bbox.top, u.bbox.left + u.bbox.width - x0, u.bbox.height)
          const dpr = devicePixelRatio, label = 'ช่วงทดสอบ →'
          u.ctx.fillStyle = C.muted
          u.ctx.font = `600 ${12 * dpr}px "IBM Plex Sans Thai", sans-serif`
          // When the test band is too narrow for the label, put it just left of the band instead.
          const fits = u.bbox.left + u.bbox.width - x0 > u.ctx.measureText(label).width + 16 * dpr
          const tw = u.ctx.measureText(label).width, ty = u.bbox.top + 16 * dpr
          const tx = fits ? x0 + 8 * dpr : x0 - 6 * dpr - tw
          u.ctx.fillStyle = 'rgba(255,255,255,0.85)'
          u.ctx.beginPath(); u.ctx.roundRect(tx - 6 * dpr, ty - 13 * dpr, tw + 12 * dpr, 19 * dpr, 6 * dpr); u.ctx.fill()
          u.ctx.fillStyle = C.muted
          u.ctx.fillText(label, tx, ty)
          u.ctx.textAlign = 'left'
        }],
      },
    }
    return {
      data: [x, A.prob.map((v, i) => (i < cut ? nul(v) : null)), A.prob.map((v, i) => (i >= cut - 1 ? nul(v) : null)),
        x.map(() => threshold)] as uPlot.AlignedData,
      opts: {
        width, height, plugins: [testShade], legend: { show: false }, cursor: { y: false },
        scales: { x: { time: true }, y: { range: [0, 1] } },
        axes: [axis(), axis({ side: 1, size: 48, values: (_u, v) => v.map(n => `${Math.round(n * 100)}%`) })],
        series: [{},
          { label: 'In-sample', stroke: 'rgba(74,97,133,0.55)', width: 1.1 },
          { label: 'Out-of-sample', stroke: C.red, width: 1.6 },
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
