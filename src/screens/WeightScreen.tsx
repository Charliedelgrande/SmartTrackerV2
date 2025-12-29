import { useLiveQuery } from "dexie-react-hooks"
import { MoreVertical, Pencil } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { db, type WeightEntry, type WeightGoal } from "@/db"
import { SwipeRow } from "@/components/SwipeRow"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatDateShort, todayYMD } from "@/lib/date"

const EMPTY_WEIGHTS: WeightEntry[] = []

export function WeightScreen() {
  const today = todayYMD()

  const weights = useLiveQuery(
    () => db.weights.orderBy("[date+createdAt]").reverse().toArray(),
    [],
    EMPTY_WEIGHTS
  )

  const goal = useLiveQuery(() => db.weightGoals.get("weight"), [], undefined)

  const latest = weights[0]

  const [todayWeight, setTodayWeight] = useState("")

  const [editing, setEditing] = useState<WeightEntry | null>(null)
  const [goalOpen, setGoalOpen] = useState(false)

  const grouped = useMemo(() => {
    const map = new Map<string, WeightEntry[]>()
    for (const w of weights) {
      const arr = map.get(w.date) ?? []
      arr.push(w)
      map.set(w.date, arr)
    }
    return Array.from(map.entries())
  }, [weights])

  const progress = useMemo(() => {
    if (!goal || !latest) return null
    const startWeight =
      goal.startWeight ??
      weights[weights.length - 1]?.weight ??
      latest.weight
    const target = goal.targetWeight
    const current = latest.weight
    if (!Number.isFinite(startWeight) || !Number.isFinite(target)) return null
    if (startWeight === target) return 1
    const losing = target < startWeight
    const p = losing
      ? (startWeight - current) / (startWeight - target)
      : (current - startWeight) / (target - startWeight)
    return Math.max(0, Math.min(1, p))
  }, [goal, latest, weights])

  async function upsertToday() {
    const w = Number(todayWeight)
    if (!Number.isFinite(w) || w <= 0) return
    const existing = await db.weights
      .where("date")
      .equals(today)
      .last()
    const createdAt = Date.now()
    if (existing?.id) {
      await db.weights.update(existing.id, { weight: w, unit: "lb", createdAt })
      toast("Updated today")
    } else {
      await db.weights.add({ date: today, weight: w, unit: "lb", createdAt })
      toast("Saved")
    }
    setTodayWeight("")
  }

  function deleteWithUndo(entry: WeightEntry) {
    if (!entry.id) return
    void db.weights.delete(entry.id)
    toast("Deleted", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => void db.weights.put(entry),
      },
    })
  }

  async function saveEdit(next: WeightEntry) {
    if (!next.id) return
    await db.weights.update(next.id, {
      date: next.date,
      weight: next.weight,
      unit: "lb",
      note: next.note,
    })
    setEditing(null)
    toast("Saved")
  }

  async function saveGoal(next: WeightGoal) {
    await db.weightGoals.put(next)
    setGoalOpen(false)
    toast("Goal saved")
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Goal</CardTitle>
              <CardDescription>
                {goal
                  ? `${goal.targetWeight} ${goal.unit}${
                      goal.targetDate ? ` · ${goal.targetDate}` : ""
                    }`
                  : "Set a target weight"}
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={() => setGoalOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={goal ? "Edit goal" : "Set goal"}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <div className="text-xs text-muted-foreground">Current</div>
            <div className="text-sm font-semibold">
              {latest ? `${latest.weight} lb` : "—"}
            </div>
          </div>
          <Progress value={progress ? Math.round(progress * 100) : 0} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {goal ? `Target: ${goal.targetWeight} lb` : "Target: —"}
            </span>
            <span>{progress != null ? `${Math.round(progress * 100)}%` : "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Log today</CardTitle>
          <CardDescription>{today}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Input
            inputMode="decimal"
            placeholder="Weight (lb)"
            value={todayWeight}
            onChange={(e) => setTodayWeight(e.target.value)}
          />
          <Button
            type="button"
            onClick={() => void upsertToday()}
            className="w-full"
            disabled={!todayWeight.trim()}
          >
            Save
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 pb-2">
        <div className="px-1 text-xs font-medium text-muted-foreground">
          History
        </div>
        {grouped.length === 0 ? (
          <div className="px-1 text-sm text-muted-foreground">No entries yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {grouped.map(([date, entries]) => (
              <div key={date} className="flex flex-col gap-2">
                <div className="px-1 text-xs text-muted-foreground">
                  {formatDateShort(date)} · {date}
                </div>
                {entries.map((entry) => {
                  const idx = weights.findIndex((w) => w.id === entry.id)
                  const prev = idx >= 0 ? weights[idx + 1] : undefined
                  const delta =
                    prev ? entry.weight - prev.weight : null
                  return (
                    <SwipeRow
                      key={entry.id}
                      onEdit={() => setEditing(entry)}
                      onDelete={() => deleteWithUndo(entry)}
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <div className="text-sm font-medium">
                              {formatDateShort(entry.date)}
                            </div>
                            <div className="text-sm font-semibold">
                              {entry.weight} lb
                            </div>
                          </div>
                          {delta != null ? (
                            <div className="text-xs text-muted-foreground">
                              Δ {delta > 0 ? "+" : ""}
                              {delta.toFixed(1)} lb
                            </div>
                          ) : null}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-5 w-5" />
                              <span className="sr-only">Menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setEditing(entry)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => deleteWithUndo(entry)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SwipeRow>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit entry */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Edit weight</SheetTitle>
          </SheetHeader>
          <SheetBody>
            {editing ? (
              <EditWeightForm
                entry={editing}
                onCancel={() => setEditing(null)}
                onSave={(next) => void saveEdit(next)}
              />
            ) : null}
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Edit goal */}
      <Sheet open={goalOpen} onOpenChange={setGoalOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{goal ? "Edit goal" : "Set goal"}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <EditGoalForm
              goal={
                goal ?? {
                  id: "weight",
                  targetWeight: 0,
                unit: "lb",
                }
              }
              onSave={(next) => void saveGoal(next)}
            />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function EditWeightForm({
  entry,
  onSave,
  onCancel,
}: {
  entry: WeightEntry
  onSave: (next: WeightEntry) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(entry.date)
  const [weight, setWeight] = useState(String(entry.weight))
  const [note, setNote] = useState(entry.note ?? "")

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Date</div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Weight</div>
        <Input
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Note (optional)</div>
        <Input value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={() =>
            onSave({
              ...entry,
              date,
              weight: Number(weight),
              unit: "lb",
              note: note.trim() ? note.trim() : undefined,
            })
          }
        >
          Save
        </Button>
      </div>
    </div>
  )
}

function EditGoalForm({
  goal,
  onSave,
}: {
  goal: WeightGoal
  onSave: (next: WeightGoal) => void
}) {
  const [targetWeight, setTargetWeight] = useState(String(goal.targetWeight ?? ""))
  const [targetDate, setTargetDate] = useState(goal.targetDate ?? "")

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Target</div>
        <Input
          inputMode="decimal"
          value={targetWeight}
          onChange={(e) => setTargetWeight(e.target.value)}
          placeholder="Target weight (lb)"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Target date (optional)</div>
        <Input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>
      <Button
        onClick={() =>
          onSave({
            id: "weight",
            unit: "lb",
            targetWeight: Number(targetWeight),
            targetDate: targetDate.trim() ? targetDate : undefined,
          })
        }
        disabled={!targetWeight.trim()}
      >
        Save goal
      </Button>
    </div>
  )
}


