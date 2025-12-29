import { Dumbbell, Flame, Scale } from "lucide-react"
import type { ComponentType } from "react"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export type TabKey = "weight" | "workout" | "calories"

const tabs: Array<{
  key: TabKey
  label: string
  icon: ComponentType<{ className?: string }>
}> = [
  { key: "weight", label: "Weight", icon: Scale },
  { key: "workout", label: "Workout", icon: Dumbbell },
  { key: "calories", label: "Calories", icon: Flame },
]

export function TabBar({
  tab,
  onChange,
  onOverview,
}: {
  tab: TabKey
  onChange: (t: TabKey) => void
  onOverview: () => void
}) {
  const [armed, setArmed] = useState(false)
  const [glow, setGlow] = useState(false)
  const holdTimer = useRef<number | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const consumed = useRef(false)

  useEffect(() => {
    return () => {
      if (holdTimer.current != null) window.clearTimeout(holdTimer.current)
    }
  }, [])

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/80 backdrop-blur-md pb-[env(safe-area-inset-bottom)] transition-shadow",
        glow && "shadow-[0_-12px_40px_-12px_hsl(var(--accent))]"
      )}
      onPointerDown={(e) => {
        // Only primary pointer
        if (e.button !== 0) return
        consumed.current = false
        start.current = { x: e.clientX, y: e.clientY }
        setGlow(false)
        setArmed(false)
        if (holdTimer.current != null) window.clearTimeout(holdTimer.current)
        holdTimer.current = window.setTimeout(() => {
          setArmed(true)
          setGlow(true)
        }, 220)
      }}
      onPointerMove={(e) => {
        const s = start.current
        if (!s) return
        const dy = e.clientY - s.y
        const dx = e.clientX - s.x
        // If they start scrolling horizontally (tab taps) or move a lot before arming, cancel.
        if (!armed && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
          if (holdTimer.current != null) window.clearTimeout(holdTimer.current)
          holdTimer.current = null
        }
        if (armed && dy < -36) {
          consumed.current = true
          setGlow(false)
          setArmed(false)
          start.current = null
          if (holdTimer.current != null) window.clearTimeout(holdTimer.current)
          holdTimer.current = null
          onOverview()
        }
      }}
      onPointerUp={() => {
        if (holdTimer.current != null) window.clearTimeout(holdTimer.current)
        holdTimer.current = null
        start.current = null
        setArmed(false)
        setGlow(false)
      }}
      onPointerCancel={() => {
        if (holdTimer.current != null) window.clearTimeout(holdTimer.current)
        holdTimer.current = null
        start.current = null
        setArmed(false)
        setGlow(false)
      }}
    >
      <div className="mx-auto flex max-w-md">
        {tabs.map((t) => {
          const active = t.key === tab
          const Icon = t.icon
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                if (consumed.current) return
                onChange(t.key)
              }}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 px-2 py-3 text-xs",
                active ? "text-foreground" : "text-muted-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={cn(
                  "absolute top-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full transition-opacity",
                  active ? "opacity-100 bg-[hsl(var(--accent))]" : "opacity-0"
                )}
              />
              <Icon className="h-5 w-5" />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}


