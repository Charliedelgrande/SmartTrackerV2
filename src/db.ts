import Dexie, { type Table } from "dexie"

export type Unit = "lb"

export type WeightEntry = {
  id?: number
  date: string // YYYY-MM-DD (local)
  weight: number
  unit: Unit
  note?: string
  createdAt: number
}

export type WeightGoal = {
  id: "weight"
  targetWeight: number
  unit: Unit
  startWeight?: number
  startDate?: string
  targetDate?: string
}

export type WorkoutSetEntry = {
  id?: number
  date: string // YYYY-MM-DD (local)
  exercise: string
  reps: number
  weight: number
  unit: Unit
  notes?: string
  createdAt: number
}

export type CalorieEntry = {
  id?: number
  date: string // YYYY-MM-DD (local)
  calories: number
  label?: string
  createdAt: number
}

export type CalorieGoal = {
  id: "calories"
  targetCalories: number
  /**
   * Minutes after midnight (local) when the "calorie day" resets.
   * Example: 12:00 -> 720
   */
  resetMinutes?: number
}

class TrackerDB extends Dexie {
  weights!: Table<WeightEntry, number>
  weightGoals!: Table<WeightGoal, string>
  workoutSets!: Table<WorkoutSetEntry, number>
  calories!: Table<CalorieEntry, number>
  calorieGoals!: Table<CalorieGoal, string>

  constructor() {
    super("simple-tracker-v2")
    this.version(1).stores({
      weights: "++id,date,createdAt,[date+createdAt]",
      weightGoals: "id",
      workoutSets: "++id,date,exercise,createdAt,[date+createdAt]",
      calories: "++id,date,createdAt,[date+createdAt]",
    })
    this.version(2).stores({
      weights: "++id,date,createdAt,[date+createdAt]",
      weightGoals: "id",
      workoutSets: "++id,date,exercise,createdAt,[date+createdAt]",
      calories: "++id,date,createdAt,[date+createdAt]",
      calorieGoals: "id",
    })
    this.version(3)
      .stores({
        weights: "++id,date,createdAt,[date+createdAt]",
        weightGoals: "id",
        workoutSets: "++id,date,exercise,createdAt,[date+createdAt]",
        calories: "++id,date,createdAt,[date+createdAt]",
        calorieGoals: "id",
      })
      .upgrade(async (tx) => {
        const KG_TO_LB = 2.2046226218

        // We used to allow kg; normalize everything to lb.
        await tx
          .table("weights")
          .toCollection()
          .modify((w: Record<string, unknown>) => {
            if (w["unit"] === "kg" && typeof w["weight"] === "number") {
              w["weight"] = Math.round((w["weight"] as number) * KG_TO_LB * 10) / 10
            }
            w["unit"] = "lb"
          })

        await tx
          .table("workoutSets")
          .toCollection()
          .modify((s: Record<string, unknown>) => {
            if (s["unit"] === "kg" && typeof s["weight"] === "number") {
              s["weight"] = Math.round((s["weight"] as number) * KG_TO_LB * 10) / 10
            }
            s["unit"] = "lb"
          })

        await tx
          .table("weightGoals")
          .toCollection()
          .modify((g: Record<string, unknown>) => {
            if (g["unit"] === "kg") {
              if (typeof g["targetWeight"] === "number") {
                g["targetWeight"] =
                  Math.round((g["targetWeight"] as number) * KG_TO_LB * 10) / 10
              }
              if (typeof g["startWeight"] === "number") {
                g["startWeight"] =
                  Math.round((g["startWeight"] as number) * KG_TO_LB * 10) / 10
              }
            }
            g["unit"] = "lb"
          })
      })
  }
}

export const db = new TrackerDB()


