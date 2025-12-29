import { Dumbbell, Flame, Scale } from "lucide-react"
import type { ComponentType } from "react"

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
}: {
  tab: TabKey
  onChange: (t: TabKey) => void
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/80 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md">
        {tabs.map((t) => {
          const active = t.key === tab
          const Icon = t.icon
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
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


