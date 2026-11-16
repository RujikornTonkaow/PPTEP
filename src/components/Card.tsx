import { useId, useState, type ReactNode } from 'react'

/**
 * Glass card that opens and closes. The title area is the toggle button;
 * `actions` sit outside the button so they can hold their own controls.
 */
export function Card({ title, eyebrow, summary, actions, children, defaultOpen = true, open: ctrl, onToggle, className = '', id }: {
  title: ReactNode; eyebrow?: ReactNode; summary?: ReactNode; actions?: ReactNode; children: ReactNode
  defaultOpen?: boolean; open?: boolean; onToggle?: (open: boolean) => void; className?: string; id?: string
}) {
  const [own, setOwn] = useState(defaultOpen)
  const open = ctrl ?? own
  const bodyId = useId()
  const toggle = () => { const n = !open; if (ctrl === undefined) setOwn(n); onToggle?.(n) }
  return (
    <section id={id} className={`glass card ${open ? 'is-open' : ''} ${className}`}>
      <div className="card-head">
        <button type="button" className="card-toggle" aria-expanded={open} aria-controls={bodyId} onClick={toggle}>
          <span className="card-titles">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <span className="card-title">{title}</span>
          </span>
          {summary && <span className="card-summary">{summary}</span>}
          <span className="chev" aria-hidden="true" />
        </button>
        {actions && <div className="card-actions">{actions}</div>}
      </div>
      <div className="card-body" id={bodyId} inert={!open}>
        <div className="card-body-inner"><div className="card-pad">{children}</div></div>
      </div>
    </section>
  )
}
