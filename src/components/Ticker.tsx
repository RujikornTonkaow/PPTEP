import type { Analysis } from '../lib/analytics'
import { fmt, pct, pp, thDate, tone, useC } from '../lib/format'
import { Spark } from './Charts'

interface Item { key: string; label: string; value: string; change: string; dir: string; spark: number[]; target: string }

/**
 * Ticker tape under the nav: last close and 1-day change of PTTEP and every driver, plus the model signal.
 * The strip is rendered twice and slid by -50% for a seamless loop; the copy is hidden from assistive tech.
 */
export function Ticker({ A, pBear, bear, onPick }: { A: Analysis; pBear: number; bear: boolean; onPick: (target: string) => void }) {
  const C = useC()
  const L = A.n - 1
  const d1 = A.px[L] / A.px[L - 1] - 1
  const items: Item[] = [
    { key: 'PTTEP', label: 'PTTEP', value: fmt(A.px[L]), change: pct(d1), dir: tone(d1), spark: A.px.slice(-30), target: 'price' },
    ...A.drivers.map(d => ({
      key: d.key, label: d.short, value: fmt(d.last, d.type === 'pct' ? 2 : 3),
      change: d.type === 'pct' ? pct(d.d1) : pp(d.d1), dir: tone(d.d1), spark: d.spark.slice(-30), target: d.key,
    })),
  ]
  const strip = (copy: boolean) => (
    <ul className="tick-strip" aria-hidden={copy || undefined}>
      {items.map(it => (
        <li key={it.key}>
          <button type="button" tabIndex={copy ? -1 : undefined} onClick={() => onPick(it.target)}>
            <b>{it.label}</b>
            <span className="mono">{it.value}</span>
            <span className={`mono tick-ch ${it.dir}`}>{it.dir === 'up' ? '▲' : it.dir === 'down' ? '▼' : '■'} {it.change.replace(/^[+−]/, '')}</span>
            <span className="tick-spark"><Spark values={it.spark} color={it.dir === 'down' ? C.red : C.green} /></span>
          </button>
        </li>
      ))}
      <li>
        <button type="button" tabIndex={copy ? -1 : undefined} onClick={() => onPick('signal')}>
          <b>สัญญาณ Dataiku</b>
          <span className="mono">P(Bear) {(pBear * 100).toFixed(1)}%</span>
          <span className={`tick-sig ${bear ? 'bear' : 'bull'}`}>{bear ? 'Bear' : 'Bull'}</span>
        </button>
      </li>
    </ul>
  )
  return (
    <div className="ticker glass" role="region" aria-label="สรุปราคาปิดล่าสุด">
      <span className="tick-head"><i className="tick-dot" aria-hidden="true" />ปิด {thDate(A.rows[L].Date)}</span>
      <div className="tick-viewport">
        <div className="tick-track">{strip(false)}{strip(true)}</div>
      </div>
    </div>
  )
}
