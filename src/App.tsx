import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import csvRaw from './data/PTTEP_all_Final_Full_scored.csv?raw'
import testRaw from './data/Q2_LightGBM_test_predicted.csv?raw'
import logo from './assets/pttep-logo.jpeg'
import heroImg from './assets/pttep-hero.webp'
import { analyse, DATAIKU_IMPORTANCE, evaluate, parseCSV, type Analysis } from './lib/analytics'
import { C, fmt, pct, pp, thDate, tone } from './lib/format'
import { PriceChart, ProbChart, Spark } from './components/Charts'
import { Card } from './components/Card'
import AnalysisSection from './components/Analysis'
import { CountUp, useReveal } from './lib/motion'
import { Ticker } from './components/Ticker'

const RidgeScene = lazy(() => import('./components/RidgeScene'))
// Dates Dataiku held out as its test set (Q2 LightGBM → Predicted data).
const TEST_DATES = new Set(testRaw.trim().split(/\r?\n/).slice(1).map(l => l.slice(0, 10)))
const EMBEDDED = analyse(parseCSV(csvRaw), TEST_DATES)
const RANGES = [{ l: '3M', d: 63 }, { l: '6M', d: 126 }, { l: '1Y', d: 252 }, { l: 'ทั้งหมด', d: 0 }]

const DRIVER_TH: Record<string, { cat: string; why: string }> = {
  Brent_Close: { cat: 'ปัจจัยอุตสาหกรรม', why: 'ราคาน้ำมันดิบกำหนดรายได้หลักของ PTTEP ราคาก๊าซบางส่วนก็ผูกกับราคาน้ำมันแบบมีการหน่วงเวลา' },
  SET_Index: { cat: 'อารมณ์ตลาดไทย', why: 'สะท้อนความต้องการรับความเสี่ยงของตลาดหุ้นไทยและเงินทุนต่างชาติ PTTEP เป็นหุ้นใหญ่จึงมักขยับตามตลาด' },
  SP500_Close: { cat: 'อารมณ์ตลาดโลก', why: 'ผลในวันเดียวกันน้อย เพราะตลาดสหรัฐเปิดหลังตลาดไทยปิด แต่มีผลมากช่วงตลาดโลกเทขาย' },
  FX_THB_per_USD: { cat: 'เศรษฐกิจมหภาค', why: 'PTTEP ขายเป็นดอลลาร์ บาทอ่อนทำให้รายได้ในรูปเงินบาทสูงขึ้น ผลมักเห็นตอนประกาศงบมากกว่ารายวัน' },
  Thailand_10Y_Yield_Pct: { cat: 'เศรษฐกิจมหภาค', why: 'อัตราคิดลดระยะยาว ถ้าสูงขึ้น ต้นทุนเงินทุนสูงขึ้นและมูลค่าหุ้นจาก DCF ลดลง' },
  Thailand_1Y_Yield_Pct: { cat: 'เศรษฐกิจมหภาค', why: 'สะท้อนการคาดการณ์ดอกเบี้ยนโยบายระยะสั้นของธนาคารแห่งประเทศไทย' },
}
const DRIVER_NAME_TH: Record<string, string> = {
  Brent_Close: 'น้ำมันดิบ Brent', SET_Index: 'ดัชนี SET', SP500_Close: 'S&P 500', FX_THB_per_USD: 'ค่าเงิน USD/THB',
  Thailand_10Y_Yield_Pct: 'พันธบัตรไทย 10 ปี', Thailand_1Y_Yield_Pct: 'พันธบัตรไทย 1 ปี',
}
const UNIT_TH: Record<string, string> = { 'USD/bbl': 'ดอลลาร์/บาร์เรล', pts: 'จุด', THB: 'บาท', '%': '%' }

function Gauge({ p, x }: { p: number; x: number }) {
  const R = 100, cx = 120, cy = 118
  const pt = (v: number, r = R) => { const a = Math.PI * (1 - v); return [cx + r * Math.cos(a), cy - r * Math.sin(a)] }
  const [nx, ny] = pt(p, R - 14)
  const [t0x, t0y] = pt(x, R - 18), [t1x, t1y] = pt(x, R + 14)
  return (
    <svg viewBox="0 0 240 136" className="gauge" role="img" aria-label={`ความน่าจะเป็น Bear ${(p * 100).toFixed(1)}% เกณฑ์ ${x.toFixed(2)}`}>
      <defs>
        <linearGradient id="gg" x1="0" x2="1">
          <stop offset="0" stopColor={C.green} /><stop offset="0.5" stopColor="#dbe7f7" /><stop offset="1" stopColor={C.red} />
        </linearGradient>
      </defs>
      <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} fill="none" stroke="url(#gg)" strokeWidth="16" strokeLinecap="round" />
      <line x1={t0x} y1={t0y} x2={t1x} y2={t1y} stroke={C.amber} strokeWidth="3" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={C.ink} strokeWidth="3.5" strokeLinecap="round" className="needle" />
      <circle cx={cx} cy={cy} r="8" fill={C.ink} /><circle cx={cx} cy={cy} r="3" fill="#fff" />
    </svg>
  )
}

export default function App() {
  const [A, setA] = useState<Analysis>(EMBEDDED)
  const [source, setSource] = useState('ข้อมูล WS3 + ผล score จาก Dataiku (WS4)')
  const [error, setError] = useState('')
  const [range, setRange] = useState(252)
  const [threshold, setThreshold] = useState(0.45)
  const [openDrivers, setOpenDrivers] = useState<Record<string, boolean>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const heroRef = useRef<HTMLElement>(null)

  // Haze the backdrop photo once the hero scrolls away, so body text stays readable.
  useEffect(() => {
    const el = heroRef.current; if (!el) return
    const io = new IntersectionObserver(([e]) => document.documentElement.classList.toggle('scrolled', !e.isIntersecting),
      { rootMargin: '-45% 0px 0px 0px' })
    io.observe(el); return () => io.disconnect()
  }, [])

  useReveal()

  const L = A.n - 1
  const last = A.rows[L]
  const pBear = A.prob[L]
  const bear = pBear >= threshold
  const ev = useMemo(() => evaluate(A.yTe, A.pTe, threshold), [A, threshold])
  const drivers = useMemo(() => [...A.drivers].sort((a, b) => Math.abs(b.corr60) - Math.abs(a.corr60)), [A])
  const maxImp = DATAIKU_IMPORTANCE[0].pct
  const d1 = A.px[L] / A.px[L - 1] - 1
  const vsSma = A.px[L] / A.sma[L] - 1
  const allDriversOpen = drivers.every(d => openDrivers[d.key])

  // Ticker clicks: drivers open their card first, then everything scrolls into view.
  const pick = (target: string) => {
    const isDriver = A.drivers.some(d => d.key === target)
    if (isDriver) setOpenDrivers(o => ({ ...o, [target]: true }))
    requestAnimationFrame(() => document.getElementById(isDriver ? `drv-${target}` : target)?.scrollIntoView({ block: isDriver ? 'center' : 'start' }))
  }

  const onFile = (f?: File) => {
    if (!f) return
    f.text().then(t => {
      try { setA(analyse(parseCSV(t), TEST_DATES)); setSource(f.name); setError('') }
      catch (e) { setError((e as Error).message) }
    })
  }

  return (
    <>
      <div className="backdrop" aria-hidden="true"><img src={heroImg} alt="" /></div>
      <a className="skip" href="#main">ข้ามไปยังเนื้อหา</a>

      <header className="nav">
        <div className="nav-inner glass">
          <a className="brand" href="#top" aria-label="PTTEP Stock Radar กลับไปด้านบน">
            <span className="logo-chip"><img src={logo} alt="PTTEP" /></span>
            <span className="brand-name">Stock Radar</span>
          </a>
          <nav className="nav-links" aria-label="ส่วนต่างๆ">
            <a href="#price">ราคา</a><a href="#drivers">ปัจจัย</a><a href="#signal">สัญญาณ</a><a href="#analysis">บทวิเคราะห์</a>
          </nav>
          <div className="nav-tools">
            <span className="data-pill mono" title={source}>{thDate(A.rows[0].Date)} – {thDate(last.Date)}</span>
            <input ref={fileRef} type="file" accept=".csv" hidden onChange={e => onFile(e.target.files?.[0])} />
            <button className="btn" onClick={() => fileRef.current?.click()}>โหลด CSV</button>
          </div>
        </div>
        {error && <div className="error glass" role="alert">โหลดไฟล์ไม่สำเร็จ: {error}</div>}
        <Ticker A={A} pBear={pBear} bear={bear} onPick={pick} />
      </header>

      <main id="main">
        <section className="hero" id="top" ref={heroRef}>
          <div className="hero-inner">
            <div className="hero-radar glass">
              <Suspense fallback={<div className="radar-canvas loading"><span>กำลังโหลดภาพ 3 มิติ…</span></div>}>
                <RidgeScene A={A} />
              </Suspense>
            </div>
            <div className="hero-copy glass">
              <p className="eyebrow">SET: PTTEP · ธุรกิจสำรวจและผลิตปิโตรเลียม · ราคาปิด {thDate(last.Date)}</p>
              <h1>วันนี้อะไรกำลังดึง <span className="grad">PTTEP</span>?</h1>
              <p className="lede">6 ปัจจัยรายวัน กับ 1 สัญญาณตลาด แต่ละแถบคือเส้นทาง 120 วันทำการล่าสุด แถบหน้าสุดคือ PTTEP ระบายสีตาม Bull/Bear แถบยิ่งสีเข้ม ยิ่งขยับไปพร้อมกับ PTTEP มาก</p>

              <div className="widget">
                <span className="label">สัญญาณจาก Dataiku · LightGBM</span>
                <div className="signal-row">
                  <span className={`signal-word ${bear ? 'bear' : 'bull'}`}>{bear ? 'Bear' : 'Bull'}</span>
                  <span className="mono signal-p">P(Bear) <CountUp value={pBear * 100} delay={350} format={v => `${v.toFixed(1)}%`} /></span>
                </div>
                <dl className="widget-grid">
                  <div><dt>ราคาปิด</dt><dd className="mono"><CountUp value={A.px[L]} delay={450} format={v => fmt(v)} /><small className={tone(d1)}>{pct(d1)}</small></dd></div>
                  <div><dt>Regime</dt><dd className={`mono ${last.Regime === 'Bear' ? 'down' : 'up'}`}>{last.Regime}<small>SMA50 {pct(vsSma, 1)}</small></dd></div>
                  <div><dt>ผันผวน 20 วัน</dt><dd className="mono"><CountUp value={A.vol20 * 100} delay={450} format={v => `${v.toFixed(1)}%`} /><small>เฉลี่ย {(A.volAll * 100).toFixed(0)}%</small></dd></div>
                </dl>
              </div>

              <ul className="legend">
                <li><i className="lg-up" />PTTEP ช่วง Bull</li>
                <li><i className="lg-down" />PTTEP ช่วง Bear</li>
                <li><i className="lg-dist" />สีเข้ม = correlation 60 วันสูง</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section" id="price">
          <Card eyebrow="ราคา · SMA 50 วัน · label จาก WS3" title="ราคาและ Regime"
            summary={<span className="mono pill">{fmt(A.px[L])} บาท</span>}
            actions={
              <div className="seg" role="group" aria-label="ช่วงเวลาของกราฟ">
                {RANGES.map(r => (
                  <button key={r.l} className={range === r.d ? 'on' : ''} aria-pressed={range === r.d} onClick={() => setRange(r.d)}>{r.l}</button>
                ))}
              </div>
            }>
            <PriceChart A={A} range={range} />
            <div className="chart-key">
              <span><i style={{ background: C.blue }} />ราคาปิด PTTEP (บาท)</span>
              <span><i className="dash" style={{ borderColor: C.amber }} />SMA50</span>
              <span><i className="band bull" />Bull: ราคาปิด ≥ SMA50</span>
              <span><i className="band bear" />Bear: ราคาปิด &lt; SMA50</span>
            </div>
          </Card>
        </section>

        <section className="section" id="drivers">
          <div className="section-head">
            <div><p className="eyebrow">เรียงตาม correlation 60 วันกับ PTTEP · กดการ์ดเพื่อดูรายละเอียด</p><h2>ปัจจัยรายวัน</h2></div>
            <button type="button" className="btn-ghost" onClick={() =>
              setOpenDrivers(allDriversOpen ? {} : Object.fromEntries(drivers.map(d => [d.key, true])))}>
              {allDriversOpen ? 'ปิดทุกการ์ด' : 'เปิดทุกการ์ด'}</button>
          </div>
          <div className="driver-grid">
            {drivers.map(d => {
              const th = DRIVER_TH[d.key]
              const fv = (v: number) => (d.type === 'pct' ? pct(v) : pp(v))
              const s = Math.min(Math.abs(d.corr60) / 0.6, 1)
              return (
                <Card key={d.key} id={`drv-${d.key}`} className="driver" eyebrow={th.cat} title={DRIVER_NAME_TH[d.key]}
                  open={!!openDrivers[d.key]} onToggle={v => setOpenDrivers(o => ({ ...o, [d.key]: v }))}
                  summary={
                    <span className="driver-sum">
                      <span className="mono big">{fmt(d.last, d.type === 'pct' ? 2 : 3)}</span>
                      <span className={`mono chip-sm ${tone(d.impact)}`}>{pct(d.impact)}</span>
                      <span className="mini-corr" aria-hidden="true"><i style={{ width: `${s * 100}%` }} /></span>
                    </span>
                  }>
                  <p className="driver-unit">หน่วย: {UNIT_TH[d.unit]} · ผลกระทบโดยประมาณวันนี้ <b className={tone(d.impact)}>{pct(d.impact)}</b></p>
                  <Spark values={d.spark} color={d.d20 >= 0 ? C.green : C.red} />
                  <dl className="driver-stats">
                    <div><dt>1 วัน</dt><dd className={`mono ${tone(d.d1)}`}>{fv(d.d1)}</dd></div>
                    <div><dt>20 วัน</dt><dd className={`mono ${tone(d.d20)}`}>{fv(d.d20)}</dd></div>
                    <div><dt>Beta</dt><dd className="mono">{d.beta60.toFixed(2)}</dd></div>
                  </dl>
                  <div className="corr-bar"><span>ρ 60 วัน</span><div><i style={{ width: `${s * 100}%` }} /></div><b className="mono">{d.corr60.toFixed(2)}</b></div>
                  <p className="why">{th.why}</p>
                </Card>
              )
            })}
          </div>
          <p className="note">ผลกระทบโดยประมาณ = beta 60 วัน × การขยับของปัจจัยวันนี้ เป็นการขยับร่วมกัน ไม่ใช่เหตุและผล</p>
        </section>

        <section className="section" id="signal">
          <div className="section-head">
            <div><p className="eyebrow">Dataiku · LightGBM · P(Bear) จาก score recipe</p><h2>สัญญาณ Regime</h2></div>
          </div>
          <div className="signal-layout">
            <Card className="signal-card" eyebrow="P(Bear) ล่าสุด" title="มาตรวัดสัญญาณ"
              summary={<span className={`chip ${bear ? 'bear' : 'bull'}`}>{bear ? 'Bear' : 'Bull'}</span>}>
              <div className="gauge-wrap">
                <Gauge p={pBear} x={threshold} />
                <div className="gauge-read">
                  <span className={`mono gauge-p ${bear ? 'down' : 'up'}`}>{(pBear * 100).toFixed(1)}%</span>
                </div>
                <label className="slider">
                  <span>เกณฑ์ Bear <i className="mono">x</i></span>
                  <input type="range" min={0.2} max={0.8} step={0.01} value={threshold} onChange={e => setThreshold(+e.target.value)} />
                  <b className="mono">{threshold.toFixed(2)}</b>
                </label>
                <p className="small">เป็น Bear เมื่อ P(Bear) ≥ x ค่าเริ่มต้น 0.45 เน้นจับขาลงให้ได้มากกว่าการเลี่ยงสัญญาณหลอก</p>
              </div>
            </Card>

            <Card eyebrow={`ชุดทดสอบของ Dataiku · สุ่ม ${A.te.length} วัน · ${thDate(A.rows[A.te[0]].Date)} – ${thDate(A.rows[A.te[A.te.length - 1]].Date)}`}
              title="ผลทดสอบกับข้อมูลที่โมเดลไม่เคยเห็น" summary={<span className="mono pill">AUC {A.aucTest.toFixed(3)}</span>}>
              <div className="cm">
                <span /><span className="cm-h">ทำนาย Bear</span><span className="cm-h">ทำนาย Bull</span>
                <span className="cm-h side">จริง Bear</span><b className="good">{ev.tp}<small>ทายถูก</small></b><b className="bad">{ev.fn}<small>พลาดขาลง</small></b>
                <span className="cm-h side">จริง Bull</span><b className="bad">{ev.fp}<small>เตือนผิด</small></b><b className="good">{ev.tn}<small>ทายถูก</small></b>
              </div>
              <dl className="metrics">
                <div><dt>ROC-AUC</dt><dd className="mono">{A.aucTest.toFixed(3)}</dd></div>
                <div><dt>F1 (Bear)</dt><dd className="mono">{ev.f1.toFixed(3)}</dd></div>
                <div><dt>Recall</dt><dd className="mono">{ev.rec.toFixed(3)}</dd></div>
                <div><dt>Precision</dt><dd className="mono">{ev.prec.toFixed(3)}</dd></div>
              </dl>
              <p className="small">Accuracy {(ev.acc * 100).toFixed(1)}% · สัดส่วน Bear ในชุดทดสอบ {(A.bearRateTest * 100).toFixed(0)}% · AUC ชุด train {A.aucTrain.toFixed(3)}</p>
            </Card>

            <Card className="wide" eyebrow="P(Bear) ตามเวลา เทียบกับเกณฑ์" title="ประวัติสัญญาณ">
              <ProbChart A={A} threshold={threshold} />
              <div className="chart-key">
                <span><i style={{ background: C.muted }} />ทุกวัน (score จาก Dataiku)</span><span><i style={{ background: C.red }} />วันที่ Dataiku ใช้ test</span>
                <span><i className="dash" style={{ borderColor: C.amber }} />เกณฑ์ x</span>
              </div>
            </Card>

            <Card className="wide" eyebrow="Feature importance (Shapley) จาก Dataiku" title="ปัจจัยที่โมเดลใช้" defaultOpen={false}
              summary={<span className="pill">{DATAIKU_IMPORTANCE.length} ตัวแปร</span>}>
              <p className="small" style={{ marginTop: 0 }}>ค่าเฉลี่ยของ |Shapley| บนชุดทดสอบ ตามที่ Dataiku รายงาน</p>
              <div className="weights imp">
                {DATAIKU_IMPORTANCE.map(f => (
                  <div className="w-row" key={f.key}>
                    <span>{f.name}</span>
                    <div className="w-track"><i className="pos" style={{ width: `${(f.pct / maxImp) * 100}%`, left: 0 }} /></div>
                    <b className="mono">{f.pct}%</b>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="section" id="analysis">
          <div className="section-head"><div><p className="eyebrow">KU FINMODEL · Workshop 2</p><h2>บทวิเคราะห์</h2></div></div>
          <AnalysisSection />
        </section>
        <p className="fineprint">ไม่ใช่คำแนะนำการลงทุน · ข้อมูล: Yahoo Finance, Investing.com</p>
      </main>

    </>
  )
}
