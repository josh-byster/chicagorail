import { assert, describe, it } from "@effect/vitest"
import { Result } from "effect"
import * as Csv from "../src/Csv.ts"

const parse = (text: string) => Csv.parse("test.txt", text)
const records = (text: string) => Result.getOrThrow(parse(text)).records.map((r) => r.fields)

describe("Csv.parse", () => {
  it("trims padding around unquoted fields, as Metra writes them", () => {
    assert.deepStrictEqual(records("service_id, monday\nA1, 1\n"), [{ service_id: "A1", monday: "1" }])
  })

  it("keeps commas, quotes and newlines inside quoted fields", () => {
    assert.deepStrictEqual(
      records("stop_id,stop_name\nX,\"Chicago, IL\"\nY,\"The \"\"Loop\"\"\"\nZ,\"two\nlines\"\n"),
      [
        { stop_id: "X", stop_name: "Chicago, IL" },
        { stop_id: "Y", stop_name: "The \"Loop\"" },
        { stop_id: "Z", stop_name: "two\nlines" }
      ]
    )
  })

  it("keeps whitespace inside quotes but allows padding outside them", () => {
    assert.deepStrictEqual(records("a,b\n \"  x \" ,y"), [{ a: "  x ", b: "y" }])
  })

  it("handles CRLF, a byte order mark, blank lines and a missing final newline", () => {
    assert.deepStrictEqual(records("﻿a,b\r\n1,2\r\n\r\n3,4"), [{ a: "1", b: "2" }, { a: "3", b: "4" }])
  })

  it("keeps empty fields", () => {
    assert.deepStrictEqual(records("a,b,c\n1,,\n"), [{ a: "1", b: "", c: "" }])
  })

  it("reports the line of a record with the wrong number of fields", () => {
    const result = parse("a,b\n1,2\n3\n")
    assert.isTrue(Result.isFailure(result))
    if (Result.isFailure(result)) {
      assert.strictEqual(result.failure.line, 3)
    }
  })

  it("counts lines inside quoted newlines when reporting errors", () => {
    const result = parse("a,b\n\"x\ny\",1\n2\n")
    assert.isTrue(Result.isFailure(result))
    if (Result.isFailure(result)) assert.strictEqual(result.failure.line, 4)
  })

  it("rejects malformed quoting", () => {
    assert.isTrue(Result.isFailure(parse("a\n\"open")))
    assert.isTrue(Result.isFailure(parse("a\nx\"y\n")))
    assert.isTrue(Result.isFailure(parse("a\n\"x\"y\n")))
  })

  it("rejects an empty file and duplicate columns", () => {
    assert.isTrue(Result.isFailure(parse("")))
    assert.isTrue(Result.isFailure(parse("a,a\n1,2")))
  })
})
