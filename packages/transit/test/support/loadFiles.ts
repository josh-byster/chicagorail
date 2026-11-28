import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { GtfsFiles } from "../../src/Gtfs.ts"

/** Read every .txt file of a GTFS directory */
export const loadFiles = (dir: string): GtfsFiles =>
  Object.fromEntries(
    readdirSync(dir).filter((f) => f.endsWith(".txt")).map((f) => [f, readFileSync(join(dir, f), "utf8")])
  )
