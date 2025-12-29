import { motion, useAnimationControls } from "framer-motion"
import { useCallback, type ReactNode } from "react"

export function SwipeRow({
  children,
  onEdit,
  onDelete,
  editThreshold = 80,
  deleteThreshold = 80,
}: {
  children: ReactNode
  onEdit: () => void
  onDelete: () => void
  editThreshold?: number
  deleteThreshold?: number
}) {
  const controls = useAnimationControls()

  const settle = useCallback(async () => {
    await controls.start({
      x: 0,
      transition: { type: "spring", stiffness: 550, damping: 42 },
    })
  }, [controls])

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card">
      <motion.div
        className="relative"
        style={{ touchAction: "pan-y" }}
        drag="x"
        dragElastic={0.18}
        dragConstraints={{ left: 0, right: 0 }}
        animate={controls}
        onDragEnd={async (_e, info) => {
          if (info.offset.x >= editThreshold) {
            onEdit()
          } else if (info.offset.x <= -deleteThreshold) {
            onDelete()
          }
          await settle()
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}


