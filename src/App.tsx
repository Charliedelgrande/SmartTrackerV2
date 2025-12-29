import { AnimatePresence, motion } from "framer-motion"
import { useMemo, useState, type CSSProperties } from "react"

import { TabBar, type TabKey } from "@/components/TabBar"
import { Toaster } from "@/components/ui/sonner"
import { CaloriesScreen } from "@/screens/CaloriesScreen"
import { WeightScreen } from "@/screens/WeightScreen"
import { WorkoutScreen } from "@/screens/WorkoutScreen"

const accentByTab: Record<TabKey, string> = {
  weight: "190 95% 45%",
  workout: "24 95% 53%",
  calories: "142 72% 45%",
}

const titleByTab: Record<TabKey, string> = {
  weight: "Weight",
  workout: "Workout",
  calories: "Calories",
}

export default function App() {
  const [tab, setTab] = useState<TabKey>("weight")

  const accent = accentByTab[tab]
  const title = titleByTab[tab]

  const screen = useMemo(() => {
    if (tab === "weight") return <WeightScreen />
    if (tab === "workout") return <WorkoutScreen />
    return <CaloriesScreen />
  }, [tab])

  return (
    <div
      className="h-dvh w-full bg-background text-foreground"
      style={{ "--accent": accent } as CSSProperties}
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col pt-[env(safe-area-inset-top)]">
        <header className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="text-sm font-semibold">{title}</div>
          <div className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-[calc(88px+env(safe-area-inset-bottom))] no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
            >
              {screen}
            </motion.div>
          </AnimatePresence>
        </main>

        <TabBar tab={tab} onChange={setTab} />
      </div>
      <Toaster />
    </div>
  )
}
