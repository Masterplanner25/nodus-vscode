# Nodus Language Support

VS Code extension for [Nodus](https://github.com/Masterplanner25/Nodus) — a workflow and scripting language for AI-native applications.

## Features

- **Syntax highlighting** for `.nd` files — keywords, DSL blocks, string interpolation, integer suffix (`42i`), both `//` and `#` comments
- **Run File** — press `Ctrl+Alt+N` or click `▶ Nodus` in the status bar
- **Format File** — runs `nodus fmt` via right-click or the Command Palette
- **Code snippets** — `fn`, `workflow`, `goal`, `step`, `tryc`, `spawn`, and more

## Requirements

Install Nodus:

```
pip install nodus-lang
```

Verify: `nodus --version` should print `4.x.x`.

## Commands

| Command | Keybinding | Description |
|---------|-----------|-------------|
| Nodus: Run File | `Ctrl+Alt+N` | Run the current `.nd` file in a terminal |
| Nodus: Format File | — | Format with `nodus fmt` |

Both commands are also available via right-click on a `.nd` file and the Command Palette (`Ctrl+Shift+P`).

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `nodus.executablePath` | `nodus` | Path to the nodus executable. Use an absolute path if nodus is not on PATH. |
| `nodus.reuseTerminal` | `false` | Reuse the existing Nodus terminal instead of opening a new one each run. |

### Custom executable path example

```json
{
  "nodus.executablePath": "C:/dev/Coding Language/.venv/Scripts/nodus.exe"
}
```

## Snippets

Type the prefix and press `Tab`:

| Prefix | Description |
|--------|-------------|
| `fn` | Function definition |
| `fnr` | Function with return type |
| `let` | Variable declaration |
| `workflow` | Workflow DSL block |
| `goal` | Goal DSL block |
| `step` | Step definition |
| `stepafter` | Step with dependency (`after`) |
| `stepwith` | Step with retry/timeout options |
| `import` | `import "std:..." as name` |
| `importfrom` | Named import from file |
| `tryc` | Try/catch block |
| `trycf` | Try/catch/finally block |
| `if` | If statement |
| `ife` | If/else block |
| `while` | While loop |
| `whilei` | While loop with integer counter |
| `fori` | For-in loop |
| `print` | print() call |
| `spawn` | Spawn a coroutine |
| `channel` | Channel producer/consumer pattern |
| `record` | Record literal |
| `runwf` | Run a workflow |
| `check` | Test check helper |

## About Nodus

Nodus `.nd` files are compiled and run by the Nodus VM. The language features:

- First-class functions, closures, coroutines, channels
- `workflow` and `goal` DSL blocks with `step` definitions and `after` dependencies
- `try/catch/finally`, `throw`, `yield`, `spawn`
- String interpolation: `"\(expr)"`
- Integer literals: `42i` (vs `42` which is float)
- Standard library: `import "std:strings" as strings`

See the [Nodus documentation](https://github.com/Masterplanner25/Nodus) for the full language reference.
