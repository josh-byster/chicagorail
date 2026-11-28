// Lint rules for the Effect packages (transit, api, mcp). They keep the code
// functional and push effects to the edges: time comes from Clock, randomness
// from Random, configuration from Config, and failures are typed errors.
import tseslint from "typescript-eslint"

const restrictedSyntax = [
  { selector: "ThrowStatement", message: "Return a typed error (Result.fail / Effect.fail) instead of throwing." },
  { selector: "TryStatement", message: "Use Effect.try / Result instead of try/catch." },
  {
    selector: "ClassDeclaration:not([superClass.type='CallExpression'])",
    message: "Model data with Schema (Schema.Class, Schema.TaggedError) or plain functions, not classes."
  },
  { selector: "Program > VariableDeclaration[kind='let']", message: "No module-level mutable state." },
  { selector: "ExportNamedDeclaration > VariableDeclaration[kind='let']", message: "No module-level mutable state." },
  { selector: "TSEnumDeclaration", message: "Use Schema.Literals instead of enums." },
  { selector: "NewExpression[callee.name='Date']", message: "Use DateTime and Clock instead of Date." }
]

export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/dist/**"] },
  {
    files: ["packages/{transit,api,mcp}/src/**/*.ts"],
    extends: [tseslint.configs.base],
    rules: {
      "no-restricted-syntax": ["error", ...restrictedSyntax],
      "no-restricted-globals": [
        "error",
        { name: "Date", message: "Use DateTime and Clock instead of Date." },
        { name: "process", message: "Read configuration with Config, not process.env." },
        { name: "setTimeout", message: "Use Effect.sleep / Schedule." },
        { name: "setInterval", message: "Use Effect.repeat with a Schedule." },
        { name: "fetch", message: "Use HttpClient." },
        { name: "console", message: "Use Effect.log." }
      ],
      "no-restricted-properties": ["error", { object: "Math", property: "random", message: "Use the Random service." }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"]
    }
  },
  {
    files: ["packages/{transit,api,mcp}/test/**/*.ts"],
    extends: [tseslint.configs.base],
    rules: { "@typescript-eslint/no-explicit-any": "error" }
  }
)
