import { useLiveQuery } from "dexie-react-hooks"
import { Dumbbell, Flame, Scale } from "lucide-react"
import { useMemo } from "react"

import { db, type CalorieEntry, type WeightEntry, type WorkoutSetEntry } from "@/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { calorieDayYMD, formatDateShort } from "@/lib/date"

const EMPTY_WEIGHTS: WeightEntry[] = []
const EMPTY_CALORIES: CalorieEntry[] = []
const EMPTY_SETS: WorkoutSetEntry[] = []

export function OverviewScreen() {
  const weights = useLiveQuery<WeightEntry[], WeightEntry[]>(
    () => db.weights.orderBy("[date+createdAt]").reverse().limit(14).toArray(),
    [],
    EMPTY_WEIGHTS
  )
  const weightGoal = useLiveQuery(() => db.weightGoals.get("weight"), [], undefined)

  const calorieGoal = useLiveQuery(() => db.calorieGoals.get("calories"), [], undefined)
  const resetMinutes = calorieGoal?.resetMinutes ?? 12 * 60
  const calorieEntries = useLiveQuery<CalorieEntry[], CalorieEntry[]>(
    () => db.calories.orderBy("[date+createdAt]").reverse().limit(200).toArray(),
    [],
    EMPTY_CALORIES
  )

  const workoutSets = useLiveQuery<WorkoutSetEntry[], WorkoutSetEntry[]>(
    () => db.workoutSets.orderBy("[date+createdAt]").reverse().limit(200).toArray(),
    [],
    EMPTY_SETS
  )

  const weightProgress = useMemo(() => {
    const latest = weights[0]
    if (!weightGoal || !latest) return null
    const startWeight = weights[weights.length - 1]?.weight ?? latest.weight
    const target = weightGoal.targetWeight
    const current = latest.weight
    if (!Number.isFinite(startWeight) || !Number.isFinite(target)) return null
    if (startWeight === target) return 1
    const losing = target < startWeight
    const p = losing
      ? (startWeight - current) / (startWeight - target)
      : (current - startWeight) / (target - startWeight)
    return Math.max(0, Math.min(1, p))
  }, [weightGoal, weights])

  const calorieToday = calorieDayYMD(new Date(), resetMinutes)
  const caloriesByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of calorieEntries) {
      map.set(e.date, (map.get(e.date) ?? 0) + e.calories)
    }
    const days = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
    return days.slice(0, 7)
  }, [calorieEntries])
  const caloriesTodayTotal = useMemo(
    () => calorieEntries.filter((e) => e.date === calorieToday).reduce((s, e) => s + e.calories, 0),
    [calorieEntries, calorieToday]
  )
  const caloriesProgress = useMemo(() => {
    if (!calorieGoal?.targetCalories) return null
    const p = caloriesTodayTotal / calorieGoal.targetCalories
    return Math.max(0, Math.min(1, p))
  }, [calorieGoal, caloriesTodayTotal])

  const workoutByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of workoutSets) {
      map.set(s.date, (map.get(s.date) ?? 0) + 1)
    }
    const days = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
    return days.slice(0, 7)
  }, [workoutSets])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <div className="px-1 text-xs font-medium text-muted-foreground">Overview</div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-[hsl(var(--accent))]" />
            <CardTitle>Weight</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <div className="text-sm font-semibold">
              {weights[0] ? `${weights[0].weight} lb` : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              {weightGoal ? `Goal ${weightGoal.targetWeight} lb` : "No goal"}
            </div>
          </div>
          <Progress value={weightProgress != null ? Math.round(weightProgress * 100) : 0} />
          <div className="flex flex-col gap-2 pt-1">
            {weights.slice(0, 5).map((w) => (
              <div key={w.id} className="flex justify-between text-xs text-muted-foreground">
                <span>{formatDateShort(w.date)}</span>
                <span className="tabular-nums">{w.weight} lb</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[hsl(var(--accent))]" />
            <CardTitle>Calories</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <div className="text-sm font-semibold tabular-nums">{caloriesTodayTotal}</div>
            <div className="text-xs text-muted-foreground">
              {calorieGoal?.targetCalories ? `Goal ${calorieGoal.targetCalories}` : "No goal"}
            </div>
          </div>
          <Progress value={caloriesProgress != null ? Math.round(caloriesProgress * 100) : 0} />
          <div className="flex flex-col gap-2 pt-1">
            {caloriesByDay.map(([date, total]) => (
              <div key={date} className="flex justify-between text-xs text-muted-foreground">
                <span>{formatDateShort(date)}</span>
                <span className="tabular-nums">{total}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-[hsl(var(--accent))]" />
            <CardTitle>Workout</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {workoutByDay.length === 0 ? (
            <div className="text-sm text-muted-foreground">No sets yet.</div>
          ) : (
            workoutByDay.map(([date, count]) => (
              <div key={date} className="flex justify-between text-xs text-muted-foreground">
                <span>{formatDateShort(date)}</span>
                <span className="tabular-nums">{count} sets</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}


