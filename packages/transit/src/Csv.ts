/**
 * RFC 4180 CSV parsing for GTFS files.
 *
 * Handles quoted fields (with embedded commas, quotes and newlines), CRLF or
 * LF line endings and a UTF-8 byte order mark. Whitespace around unquoted
 * fields is trimmed, because Metra pads its files ("A1, 1, 1"). Quoted fields
 * are kept exactly as written.
 */
import { Result, Schema } from "effect"

export class CsvError extends Schema.TaggedError<CsvError>()("CsvError", {
  file: Schema.String,
  line: Schema.Int,
  message: Schema.String
}) {}

export interface CsvRecord {
  /** 1-based line the record starts on, for error messages */
  readonly line: number
  readonly fields: Readonly<Record<string, string>>
}

export interface CsvTable {
  readonly header: ReadonlyArray<string>
  readonly records: ReadonlyArray<CsvRecord>
}

interface RawRow {
  readonly line: number
  readonly values: ReadonlyArray<string>
}

const parseRows = (file: string, text: string): Result.Result<ReadonlyArray<RawRow>, CsvError> => {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const rows: Array<RawRow> = []
  let values: Array<string> = []
  let field = ""
  let quoted = false
  let inQuotes = false
  let line = 1
  let rowLine = 1

  const endField = () => {
    values.push(quoted ? field : field.trim())
    field = ""
    quoted = false
  }
  const endRow = () => {
    endField()
    // Skip blank lines: a single empty unquoted field
    if (!(values.length === 1 && values[0] === "")) rows.push({ line: rowLine, values })
    values = []
  }

  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (inQuotes) {
      if (c === "\"") {
        if (input[i + 1] === "\"") {
          field += "\""
          i++
        } else {
          inQuotes = false
        }
      } else {
        if (c === "\n") line++
        field += c
      }
      continue
    }
    if (c === "\"") {
      if (field.trim() !== "") {
        return Result.fail(new CsvError({ file, line, message: "Quote inside an unquoted field" }))
      }
      field = ""
      quoted = true
      inQuotes = true
    } else if (c === ",") {
      endField()
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && input[i + 1] === "\n") i++
      endRow()
      line++
      rowLine = line
    } else if (quoted) {
      // Only whitespace may follow a closing quote
      if (c !== " " && c !== "\t") {
        return Result.fail(new CsvError({ file, line, message: "Text after a closing quote" }))
      }
    } else {
      field += c
    }
  }
  if (inQuotes) return Result.fail(new CsvError({ file, line: rowLine, message: "Unterminated quoted field" }))
  if (field !== "" || quoted || values.length > 0) endRow()
  return Result.succeed(rows)
}

/** Parse a CSV file whose first row is the header */
export const parse = (file: string, text: string): Result.Result<CsvTable, CsvError> =>
  Result.flatMap(parseRows(file, text), (rows) => {
    const [headerRow, ...dataRows] = rows
    if (headerRow === undefined) return Result.fail(new CsvError({ file, line: 1, message: "Missing header row" }))
    const header = headerRow.values
    const duplicate = header.find((name, i) => header.indexOf(name) !== i)
    if (duplicate !== undefined) {
      return Result.fail(new CsvError({ file, line: 1, message: `Duplicate column "${duplicate}"` }))
    }
    const records: Array<CsvRecord> = []
    for (const row of dataRows) {
      if (row.values.length !== header.length) {
        return Result.fail(
          new CsvError({
            file,
            line: row.line,
            message: `Expected ${header.length} fields, found ${row.values.length}`
          })
        )
      }
      const fields: Record<string, string> = {}
      header.forEach((name, i) => {
        fields[name] = row.values[i] as string
      })
      records.push({ line: row.line, fields })
    }
    return Result.succeed({ header, records })
  })
