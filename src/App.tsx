import { AnimatePresence, motion } from "framer-motion"
import { useMemo, useState, type CSSProperties } from "react"

import { TabBar, type TabKey } from "@/components/TabBar"
import { Toaster } from "@/components/ui/sonner"
import { CaloriesScreen } from "@/screens/CaloriesScreen"
import { OverviewScreen } from "@/screens/OverviewScreen"
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
  const [overviewOpen, setOverviewOpen] = useState(false)

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

        <TabBar tab={tab} onChange={setTab} onOverview={() => setOverviewOpen(true)} />
      </div>

      <AnimatePresence>
        {overviewOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOverviewOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-2xl border border-border bg-card shadow-2xl"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.18 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.15}
              onDragEnd={(_e, info) => {
                if (info.offset.y > 90) setOverviewOpen(false)
              }}
              style={{ touchAction: "pan-y" }}
            >
              <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-border" />
              <div className="max-h-[calc(90dvh-24px)] overflow-y-auto px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 no-scrollbar">
                <OverviewScreen />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
      <Toaster />
    </div>
  )
}
