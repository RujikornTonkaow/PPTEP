import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { Analysis, DriverStat } from '../lib/analytics'
import { C, thDate } from '../lib/format'

const N = 120          // trading days shown
const W = 5.8          // ribbon length (time axis)
const H = 1.35         // ribbon height
const GAP = 0.74       // spacing between ribbons
const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const NAME_TH: Record<string, string> = {
  Brent_Close: 'น้ำมันดิบ Brent', SET_Index: 'ดัชนี SET', SP500_Close: 'S&P 500', FX_THB_per_USD: 'ค่าเงิน USD/THB',
  Thailand_10Y_Yield_Pct: 'พันธบัตรไทย 10 ปี', Thailand_1Y_Yield_Pct: 'พันธบัตรไทย 1 ปี',
}

interface Ribbon { key: string; short: string; vals: number[]; color: THREE.Color; colors?: THREE.Color[]; d?: DriverStat }

/** Last N days of every series, min–max scaled to 0..1. Weakest driver at the back, PTTEP at the front. */
function buildRibbons(A: Analysis): Ribbon[] {
  const s = A.n - N
  const norm = (arr: number[]) => {
    const v = arr.slice(s), mn = Math.min(...v), mx = Math.max(...v)
    return v.map(x => (x - mn) / ((mx - mn) || 1))
  }
  const weak = new THREE.Color('#c3d2e8'), strong = new THREE.Color(C.blue)
  const ribbons: Ribbon[] = [...A.drivers]
    .sort((a, b) => Math.abs(a.corr60) - Math.abs(b.corr60))
    .map(d => ({ key: d.key, short: d.short, d, vals: norm(A.rows.map(r => r[d.key])),
      color: weak.clone().lerp(strong, Math.min(Math.abs(d.corr60) / 0.35, 1)) }))
  ribbons.push({ key: 'PTTEP', short: 'PTTEP', vals: norm(A.px), color: new THREE.Color(C.blue),
    colors: A.rows.slice(s).map(r => new THREE.Color(r.Regime === 'Bull' ? C.green : C.red)) })
  return ribbons
}

const xAt = (i: number) => -W / 2 + (i / (N - 1)) * W

function RibbonMesh({ r, z, active, dim, onHover, anchor }: {
  r: Ribbon; z: number; active: boolean; dim: boolean; onHover: (k: string | null) => void; anchor: (o: THREE.Object3D | null) => void
}) {
  const geo = useMemo(() => {
    const pos = new Float32Array(N * 6), col = new Float32Array(N * 6), idx: number[] = []
    const white = new THREE.Color('#ffffff')
    for (let i = 0; i < N; i++) {
      const x = xAt(i), y = r.vals[i] * H, c = r.colors ? r.colors[i] : r.color
      const base = c.clone().lerp(white, 0.85)
      pos.set([x, y, 0, x, 0, 0], i * 6)
      col.set([c.r, c.g, c.b, base.r, base.g, base.b], i * 6)
      if (i < N - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    g.setIndex(idx)
    return g
  }, [r])
  const pts = useMemo(() => r.vals.map((v, i) => [xAt(i), v * H, 0] as [number, number, number]), [r])
  const vcols = useMemo(() => r.colors?.map(c => [c.r, c.g, c.b] as [number, number, number]), [r])
  const lastCol = r.colors ? r.colors[N - 1] : r.color
  const isMain = r.key === 'PTTEP'
  return (
    <group position-z={z}
      onPointerOver={e => { e.stopPropagation(); onHover(r.key) }} onPointerOut={() => onHover(null)}
      onClick={e => { e.stopPropagation(); onHover(r.key) }}>
      <mesh geometry={geo}>
        <meshBasicMaterial vertexColors transparent side={THREE.DoubleSide} depthWrite={false}
          opacity={active ? 0.78 : dim ? 0.18 : isMain ? 0.62 : 0.42} />
      </mesh>
      <Line points={pts} color={vcols ? '#ffffff' : r.color} vertexColors={vcols}
        lineWidth={isMain ? 3.4 : active ? 2.8 : 1.8} transparent opacity={dim ? 0.35 : 1} />
      <mesh position={[W / 2, r.vals[N - 1] * H, 0]}>
        <sphereGeometry args={[isMain ? 0.09 : 0.065, 24, 24]} />
        <meshBasicMaterial color={lastCol} />
      </mesh>
      <mesh position={[W / 2, r.vals[N - 1] * H, 0]}>
        <sphereGeometry args={[isMain ? 0.2 : 0.14, 24, 24]} />
        <meshBasicMaterial color={lastCol} transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <object3D ref={anchor} position={[-W / 2 - 0.12, 0.22, 0]} />
    </group>
  )
}

function Floor({ depth }: { depth: number }) {
  const ticks = [0, 30, 60, 90, N - 1]
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.005}>
        <planeGeometry args={[W + 0.8, depth + 0.8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      {ticks.map(i => (
        <Line key={i} points={[[xAt(i), 0, -depth / 2 - 0.3], [xAt(i), 0, depth / 2 + 0.3]]}
          color={C.blue} lineWidth={0.7} transparent opacity={0.22} />
      ))}
    </group>
  )
}

function TodayPane({ depth, anchor }: { depth: number; anchor: (o: THREE.Object3D | null) => void }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current && !reduceMotion)
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.14 + Math.sin(clock.elapsedTime * 1.6) * 0.05
  })
  return (
    <group position-x={W / 2}>
      <mesh ref={ref} rotation-y={Math.PI / 2} position-y={(H + 0.35) / 2}>
        <planeGeometry args={[depth + 0.6, H + 0.35]} />
        <meshBasicMaterial color={C.cyan} transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <object3D ref={anchor} position={[0, H + 0.42, 0]} />
    </group>
  )
}

/** Projects 3D anchor objects to screen space each frame and moves their DOM labels. */
function LabelProjector({ anchors, els }: { anchors: RefObject<(THREE.Object3D | null)[]>; els: RefObject<(HTMLDivElement | null)[]> }) {
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, size }) => {
    const list = anchors.current ?? [], last = list.length - 1
    const pos = list.map(o => {
      if (!o) return null
      o.getWorldPosition(v).project(camera)
      return { x: (v.x + 1) / 2 * size.width, y: (1 - v.y) / 2 * size.height }
    })
    // Ribbon labels (all but the last, the "today" tag) run back→front = top→bottom.
    // Perspective squeezes the back rows together, so walk up from the front and keep a minimum gap.
    const gap = size.width < 520 ? 20 : 27
    for (let i = last - 2; i >= 0; i--) {
      const a = pos[i], b = pos[i + 1]
      if (a && b && a.y > b.y - gap) a.y = b.y - gap
    }
    pos.forEach((p, i) => {
      const el = els.current?.[i]; if (!p || !el) return
      // Ribbon labels are right-aligned to their anchor; never let them slide past the left edge.
      const x = i < last ? Math.max(p.x, el.offsetWidth + 6) : p.x
      el.style.transform = `translate(${x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(var(--tx, -100%), var(--ty, -50%))`
    })
  })
  return null
}

/** Pulls the camera back on narrow (portrait-ish) canvases so the whole ridgeline and its labels stay in frame. */
function CameraFit() {
  const { camera, size } = useThree()
  useEffect(() => {
    // Narrow screens also need room for the labels on the left, so pull back further there.
    const k = Math.max(1, 1.4 / (size.width / size.height)) * (size.width < 520 ? 1.15 : 1.08)
    camera.position.set(0, 5.0 * k, 8.2 * k)
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])
  return null
}

function Rig({ children, reveal }: { children: ReactNode; reveal: RefObject<THREE.Group | null> }) {
  const sway = useRef<THREE.Group>(null)
  const narrow = useThree(st => st.size.width) < 520
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (sway.current && !reduceMotion) sway.current.rotation.y = -0.06 + Math.sin(t * 0.2) * 0.07
    if (reveal.current) {
      const k = reduceMotion ? 1 : THREE.MathUtils.clamp((t - 0.25) / 1.6, 0, 1)
      reveal.current.scale.x = Math.max(1 - Math.pow(1 - k, 3), 0.0001)
    }
  })
  return <group ref={sway} rotation-y={-0.06} position-x={narrow ? 0.65 : 0.35}>{children}</group>
}

export default function RidgeScene({ A }: { A: Analysis }) {
  const ribbons = useMemo(() => buildRibbons(A), [A])
  const [hover, setHover] = useState<string | null>(null)
  const [visible, setVisible] = useState(true)
  const wrap = useRef<HTMLDivElement>(null)
  const reveal = useRef<THREE.Group>(null)
  const anchors = useRef<(THREE.Object3D | null)[]>([])
  const labelEls = useRef<(HTMLDivElement | null)[]>([])
  const depth = (ribbons.length - 1) * GAP
  const zOf = (i: number) => i * GAP - depth / 2

  useEffect(() => {
    const el = wrap.current; if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 })
    io.observe(el); return () => io.disconnect()
  }, [])

  const hr = ribbons.find(r => r.key === hover)
  const last = A.rows[A.n - 1]
  const first = A.rows[A.n - N]

  return (
    <div className="radar-wrap" ref={wrap}>
      <div className="radar-canvas">
        <Canvas camera={{ position: [0, 5.0, 8.2], fov: 34 }} dpr={[1, 1.75]}
          frameloop={visible ? 'always' : 'never'} gl={{ antialias: true, alpha: true }}>
          <CameraFit />
          <LabelProjector anchors={anchors} els={labelEls} />
          <Rig reveal={reveal}>
            <group position-y={-0.5}>
              <Floor depth={depth} />
              {/* Reveal grows the ribbons from their left (oldest) edge. */}
              <group ref={reveal} position-x={-W / 2}>
                <group position-x={W / 2}>
                  {ribbons.map((r, i) => (
                    <RibbonMesh key={r.key} r={r} z={zOf(i)} active={hover === r.key} dim={hover !== null && hover !== r.key}
                      onHover={setHover} anchor={o => { anchors.current[i] = o }} />
                  ))}
                </group>
              </group>
              <TodayPane depth={depth} anchor={o => { anchors.current[ribbons.length] = o }} />
            </group>
          </Rig>
          <OrbitControls enableZoom={false} enablePan={false} target={[0, 0.35, 0]}
            minAzimuthAngle={-0.8} maxAzimuthAngle={0.8} minPolarAngle={0.7} maxPolarAngle={1.32} />
        </Canvas>
        <div className="beacon-layer" aria-hidden="true">
          {ribbons.map((r, i) => (
            <div key={r.key} ref={el => { labelEls.current[i] = el }}
              className={`ridge-tag${r.key === 'PTTEP' ? ' main' : ''}${hover === r.key ? ' on' : ''}`}>
              <b>{r.short}</b>{r.d && <span>ρ {r.d.corr60.toFixed(2)}</span>}
            </div>
          ))}
          <div ref={el => { labelEls.current[ribbons.length] = el }} className="ridge-tag today" style={{ ['--tx' as string]: '-50%', ['--ty' as string]: '-100%' }}>
            <b>วันนี้</b><span>{thDate(last.Date)}</span>
          </div>
        </div>
      </div>
      <div className="radar-readout" aria-live="polite">
        {hr?.d ? (
          <>
            <span className="eyebrow">{NAME_TH[hr.key]}</span>
            <span>correlation 60 วัน <b>{hr.d.corr60.toFixed(2)}</b> · beta <b>{hr.d.beta60.toFixed(2)}</b></span>
            <span>ผลกระทบโดยประมาณวันนี้ <b className={hr.d.impact >= 0 ? 'up' : 'down'}>
              {hr.d.impact >= 0 ? '+' : '−'}{Math.abs(hr.d.impact * 100).toFixed(2)}%</b></span>
          </>
        ) : hr ? (
          <>
            <span className="eyebrow">PTTEP · {N} วันทำการล่าสุด</span>
            <span>ราคาปิด <b>{A.px[A.n - 1].toFixed(2)}</b> บาท · regime วันนี้ <b className={last.Regime === 'Bull' ? 'up' : 'down'}>{last.Regime}</b></span>
          </>
        ) : (
          <span className="hint">{thDate(first.Date)} – {thDate(last.Date)} · ลากเพื่อหมุน · ชี้ที่แถบเพื่อดูตัวเลข</span>
        )}
      </div>
    </div>
  )
}
