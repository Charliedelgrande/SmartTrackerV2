import { useLiveQuery } from "dexie-react-hooks"
import { ChevronDown, MoreVertical, Pencil, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { db, type CalorieEntry, type CalorieGoal } from "@/db"
import { SwipeRow } from "@/components/SwipeRow"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { calorieDayYMD, formatDateShort } from "@/lib/date"

const EMPTY_ENTRIES: CalorieEntry[] = []

function minutesToTimeValue(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function timeValueToMinutes(value: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(value)
  if (!m) return null
  const hh = Number(m[1])
  const mm = Number(m[2])
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null
  return hh * 60 + mm
}

export function CaloriesScreen() {
  const entries = useLiveQuery(
    () => db.calories.orderBy("[date+createdAt]").reverse().toArray(),
    [],
    EMPTY_ENTRIES
  )

  const goal = useLiveQuery(() => db.calorieGoals.get("calories"), [], undefined)
  const resetMinutes = goal?.resetMinutes ?? 12 * 60
  const today = calorieDayYMD(new Date(), resetMinutes)

  const todayEntries = entries.filter((e) => e.date === today)
  const todayTotal = useMemo(
    () => todayEntries.reduce((sum, e) => sum + e.calories, 0),
    [todayEntries]
  )

  const goalProgress = useMemo(() => {
    if (!goal?.targetCalories) return null
    const p = todayTotal / goal.targetCalories
    return Math.max(0, Math.min(1, p))
  }, [goal, todayTotal])

  const previousGroups = useMemo(() => {
    const map = new Map<string, CalorieEntry[]>()
    for (const e of entries) {
      if (e.date === today) continue
      const arr = map.get(e.date) ?? []
      arr.push(e)
      map.set(e.date, arr)
    }
    return Array.from(map.entries())
  }, [entries, today])

  const [customOpen, setCustomOpen] = useState(false)
  const [customCalories, setCustomCalories] = useState("")
  const [customLabel, setCustomLabel] = useState("")

  const [editing, setEditing] = useState<CalorieEntry | null>(null)
  const [goalOpen, setGoalOpen] = useState(false)
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({})

  async function addCalories(amount: number, label?: string) {
    await db.calories.add({
      date: today,
      calories: amount,
      label,
      // eslint-disable-next-line react-hooks/purity
      createdAt: Date.now(),
    })
    toast("Added")
  }

  async function addCustom() {
    const c = Number(customCalories)
    if (!Number.isFinite(c) || c <= 0) return
    await addCalories(c, customLabel.trim() ? customLabel.trim() : undefined)
    setCustomCalories("")
    setCustomLabel("")
    setCustomOpen(false)
  }

  function deleteWithUndo(entry: CalorieEntry) {
    if (!entry.id) return
    void db.calories.delete(entry.id)
    toast("Deleted", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => void db.calories.put(entry),
      },
    })
  }

  async function saveEdit(next: CalorieEntry) {
    if (!next.id) return
    await db.calories.update(next.id, {
      date: next.date,
      calories: next.calories,
      label: next.label,
    })
    setEditing(null)
    toast("Saved")
  }

  async function saveGoal(next: CalorieGoal) {
    await db.calorieGoals.put(next)
    setGoalOpen(false)
    toast("Goal saved")
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Today</CardTitle>
              <div className="text-xs text-muted-foreground">
                {today} (resets {minutesToTimeValue(resetMinutes)})
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGoalOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Edit calorie goal"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <div className="text-4xl font-semibold tabular-nums">{todayTotal}</div>
            <div className="text-xs text-muted-foreground">
              {goal?.targetCalories ? `Goal ${goal.targetCalories}` : "No goal"}
            </div>
          </div>

          {goal?.targetCalories ? (
            <div className="flex flex-col gap-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-[hsl(var(--accent))] transition-[width]"
                  style={{ width: `${Math.round((goalProgress ?? 0) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Remaining: {Math.max(0, goal.targetCalories - todayTotal)}</span>
                <span>{goalProgress != null ? `${Math.round(goalProgress * 100)}%` : "—"}</span>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-4 gap-2">
            {[100, 250, 500, 1000].map((n) => (
              <Button
                key={n}
                type="button"
                variant="outline"
                onClick={() => void addCalories(n)}
              >
                +{n}
              </Button>
            ))}
          </div>

          <Button type="button" onClick={() => setCustomOpen(true)}>
            <Plus className="h-4 w-4" />
            Add custom
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <div className="px-1 text-xs font-medium text-muted-foreground">
          Entries
        </div>
        {todayEntries.length === 0 ? (
          <div className="px-1 text-sm text-muted-foreground">No entries yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayEntries.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                onEdit={() => setEditing(e)}
                onDelete={() => deleteWithUndo(e)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pb-2">
        <div className="px-1 text-xs font-medium text-muted-foreground">
          Previous
        </div>
        {previousGroups.length === 0 ? (
          <div className="px-1 text-sm text-muted-foreground">—</div>
        ) : (
          <div className="flex flex-col gap-2">
            {previousGroups.map(([date, entries]) => {
              const open = openDates[date] ?? false
              const total = entries.reduce((sum, e) => sum + e.calories, 0)
              return (
                <Collapsible
                  key={date}
                  open={open}
                  onOpenChange={(o) =>
                    setOpenDates((prev) => ({ ...prev, [date]: o }))
                  }
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left"
                    >
                      <div className="text-sm font-medium">
                        {formatDateShort(date)}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {total}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 flex flex-col gap-2">
                    {entries.map((e) => (
                      <EntryRow
                        key={e.id}
                        entry={e}
                        onEdit={() => setEditing(e)}
                        onDelete={() => deleteWithUndo(e)}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        )}
      </div>

      {/* Custom add */}
      <Sheet open={customOpen} onOpenChange={setCustomOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Add calories</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div className="text-xs text-muted-foreground">Calories</div>
                <Input
                  inputMode="numeric"
                  value={customCalories}
                  onChange={(e) => setCustomCalories(e.target.value)}
                  placeholder="e.g. 650"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-xs text-muted-foreground">Label (optional)</div>
                <Input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g. Lunch"
                />
              </div>
              <Button onClick={() => void addCustom()} disabled={!customCalories.trim()}>
                Save
              </Button>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Goal */}
      <Sheet open={goalOpen} onOpenChange={setGoalOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{goal?.targetCalories ? "Edit goal" : "Set goal"}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <EditGoalForm
              goal={goal ?? { id: "calories", targetCalories: 0, resetMinutes: 12 * 60 }}
              onSave={(next) => void saveGoal(next)}
            />
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Edit */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Edit entry</SheetTitle>
          </SheetHeader>
          <SheetBody>
            {editing ? (
              <EditEntryForm
                entry={editing}
                onCancel={() => setEditing(null)}
                onSave={(next) => void saveEdit(next)}
              />
            ) : null}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function EntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: CalorieEntry
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <SwipeRow onEdit={onEdit} onDelete={onDelete}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold tabular-nums">
            {entry.calories}
          </div>
          {entry.label ? (
            <div className="truncate text-xs text-muted-foreground">
              {entry.label}
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
            <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </SwipeRow>
  )
}

function EditEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  entry: CalorieEntry
  onSave: (next: CalorieEntry) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(entry.date)
  const [calories, setCalories] = useState(String(entry.calories))
  const [label, setLabel] = useState(entry.label ?? "")

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Date</div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Calories</div>
        <Input
          inputMode="numeric"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Label (optional)</div>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
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
              calories: Number(calories),
              label: label.trim() ? label.trim() : undefined,
            })
          }
          disabled={!calories.trim()}
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
  goal: CalorieGoal
  onSave: (next: CalorieGoal) => void
}) {
  const [target, setTarget] = useState(String(goal.targetCalories ?? ""))
  const [resetTime, setResetTime] = useState(
    minutesToTimeValue(goal.resetMinutes ?? 12 * 60)
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Daily goal</div>
        <Input
          inputMode="numeric"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="e.g. 2200"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Reset time</div>
        <Input
          type="time"
          value={resetTime}
          onChange={(e) => setResetTime(e.target.value)}
        />
        <div className="text-xs text-muted-foreground">
          “Today” switches at this local time.
        </div>
      </div>
      <Button
        onClick={() =>
          onSave({
            id: "calories",
            targetCalories: Number(target),
            resetMinutes: timeValueToMinutes(resetTime) ?? 12 * 60,
          })
        }
        disabled={!target.trim()}
      >
        Save goal
      </Button>
    </div>
  )
}


