# Changelog

## [0.1.0] — 2026-06-13

Initial release.

- Syntax highlighting for `.nd` files (keywords, types, strings with `\()` interpolation, DSL blocks, built-in functions, numeric literals including `42i` integer suffix)
- Both `//` and `#` comment styles supported
- Language configuration: bracket matching, auto-close, comment toggling, code folding
- **Nodus: Run File** command (`Ctrl+F5`) — runs the current file in an integrated terminal
- **Nodus: Format File** command — runs `nodus fmt` and reloads the editor
- Status bar `▶ Nodus` button when editing a `.nd` file
- 17 code snippets: `fn`, `workflow`, `goal`, `step`, `stepafter`, `stepwith`, `import`, `tryc`, `trycf`, `if`, `ife`, `while`, `whilei`, `fori`, `spawn`, `channel`, `record`, `runwf`, `check`
- `nodus.executablePath` setting for custom nodus binary location
- `nodus.reuseTerminal` setting to reuse the run terminal between runs
