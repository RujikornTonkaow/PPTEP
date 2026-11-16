import { useEffect, useRef, useState } from 'react'

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Everything below the hero that should rise into view as it scrolls in. */
const REVEAL = '.section-head, .section .card, .section > .note, .analysis-index, .analysis-body > *, .fineprint'

/**
 * Marks blocks below the hero with `.rv` (hidden) and adds `.in` once each one scrolls into view.
 * Siblings get a small stagger via `--rv-d`. With reduced motion nothing is hidden at all.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    if (reduced() || typeof IntersectionObserver === 'undefined') return
    const els = Array.from(document.querySelectorAll<HTMLElement>(REVEAL)).filter(el => !el.classList.contains('in'))
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    for (const el of els) {
      const sibs = el.parentElement ? Array.from(el.parentElement.children).filter(c => c.matches(REVEAL)) : []
      el.style.setProperty('--rv-d', `${Math.min(sibs.indexOf(el), 5) * 70}ms`)
      el.classList.add('rv')
      io.observe(el)
    }
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** Counts from 0 (first time) or the previous value up to `value`. */
export function useCountUp(value: number, { duration = 900, delay = 0 } = {}) {
  const [shown, setShown] = useState(() => (reduced() ? value : 0))
  const from = useRef(reduced() ? value : 0)
  useEffect(() => {
    if (reduced()) { setShown(value); from.current = value; return }
    const start = from.current
    let raf = 0, t0 = 0
    const tick = (t: number) => {
      if (!t0) t0 = t
      const k = Math.min(Math.max((t - t0 - delay) / duration, 0), 1)
      const v = start + (value - start) * (1 - Math.pow(1 - k, 3))
      setShown(v); from.current = v
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, delay])
  return shown
}

export function CountUp({ value, format, delay }: { value: number; format: (v: number) => string; delay?: number }) {
  const v = useCountUp(value, { delay })
  return <>{format(v)}</>
}
