import { useLiveQuery } from "dexie-react-hooks"
import { ChevronDown, MoreVertical } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { db, type WorkoutSetEntry } from "@/db"
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
import { formatDateShort, todayYMD } from "@/lib/date"

const EMPTY_SETS: WorkoutSetEntry[] = []

export function WorkoutScreen() {
  const today = todayYMD()

  const sets = useLiveQuery(
    () => db.workoutSets.orderBy("[date+createdAt]").reverse().toArray(),
    [],
    EMPTY_SETS
  )

  const exercises = useMemo(() => {
    const s = new Set<string>()
    for (const e of sets) {
      const ex = e.exercise.trim()
      if (ex) s.add(ex)
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [sets])

  const todaySets = sets.filter((s) => s.date === today)
  const previousGroups = useMemo(() => {
    const map = new Map<string, WorkoutSetEntry[]>()
    for (const s of sets) {
      if (s.date === today) continue
      const arr = map.get(s.date) ?? []
      arr.push(s)
      map.set(s.date, arr)
    }
    return Array.from(map.entries())
  }, [sets, today])

  const [exercise, setExercise] = useState("")
  const [reps, setReps] = useState("")
  const [weight, setWeight] = useState("")

  const [editing, setEditing] = useState<WorkoutSetEntry | null>(null)
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({})

  async function addSet() {
    const ex = exercise.trim()
    const r = Number(reps)
    const w = Number(weight)
    if (!ex || !Number.isFinite(r) || r <= 0 || !Number.isFinite(w) || w < 0) return
    await db.workoutSets.add({
      date: today,
      exercise: ex,
      reps: r,
      weight: w,
      unit: "lb",
      createdAt: Date.now(),
    })
    setExercise("")
    setReps("")
    setWeight("")
    toast("Saved")
  }

  function deleteWithUndo(entry: WorkoutSetEntry) {
    if (!entry.id) return
    void db.workoutSets.delete(entry.id)
    toast("Deleted", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => void db.workoutSets.put(entry),
      },
    })
  }

  async function saveEdit(next: WorkoutSetEntry) {
    if (!next.id) return
    await db.workoutSets.update(next.id, {
      date: next.date,
      exercise: next.exercise,
      reps: next.reps,
      weight: next.weight,
      unit: "lb",
      notes: next.notes,
    })
    setEditing(null)
    toast("Saved")
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Add set</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Input
            placeholder="Exercise"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            list="exercise-suggestions"
          />
          <datalist id="exercise-suggestions">
            {exercises.map((ex) => (
              <option key={ex} value={ex} />
            ))}
          </datalist>

          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
            <Input
              inputMode="decimal"
              placeholder="Weight (lb)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => void addSet()}
            disabled={!exercise.trim()}
          >
            Save
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <div className="px-1 text-xs font-medium text-muted-foreground">Today</div>
        {todaySets.length === 0 ? (
          <div className="px-1 text-sm text-muted-foreground">No sets yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {todaySets.map((s) => (
              <SetRow
                key={s.id}
                entry={s}
                onEdit={() => setEditing(s)}
                onDelete={() => deleteWithUndo(s)}
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
                          {entries.length}
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
                    {entries.map((s) => (
                      <SetRow
                        key={s.id}
                        entry={s}
                        onEdit={() => setEditing(s)}
                        onDelete={() => deleteWithUndo(s)}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        )}
      </div>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Edit set</SheetTitle>
          </SheetHeader>
          <SheetBody>
            {editing ? (
              <EditSetForm
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

function SetRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: WorkoutSetEntry
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <SwipeRow onEdit={onEdit} onDelete={onDelete}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{entry.exercise}</div>
          <div className="text-xs text-muted-foreground">
            {entry.reps} × {entry.weight} lb
          </div>
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

function EditSetForm({
  entry,
  onSave,
  onCancel,
}: {
  entry: WorkoutSetEntry
  onSave: (next: WorkoutSetEntry) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(entry.date)
  const [exercise, setExercise] = useState(entry.exercise)
  const [reps, setReps] = useState(String(entry.reps))
  const [weight, setWeight] = useState(String(entry.weight))
  const [notes, setNotes] = useState(entry.notes ?? "")

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Date</div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Exercise</div>
        <Input value={exercise} onChange={(e) => setExercise(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <div className="text-xs text-muted-foreground">Reps</div>
          <Input
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="text-xs text-muted-foreground">Weight</div>
          <Input
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground">Notes (optional)</div>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
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
              exercise: exercise.trim(),
              reps: Number(reps),
              weight: Number(weight),
              unit: "lb",
              notes: notes.trim() ? notes.trim() : undefined,
            })
          }
          disabled={!exercise.trim()}
        >
          Save
        </Button>
      </div>
    </div>
  )
}


