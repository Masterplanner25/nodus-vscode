# Changelog

## [0.1.1] — 2026-08-15

- Highlight `match`, `break` and `continue`. They shipped in nodus-lang v4.1.0
  and rendered as plain identifiers, which reads as "this isn't real syntax yet"
  to anyone following the Control Flow docs
  ([nodus-lang#357](https://github.com/Masterplanner25/Nodus/issues/357)).

  They are *contextual* keywords — recognised by the parser from identifier
  tokens rather than reserved by the lexer — so nothing listed them anywhere a
  tool could read. nodus-lang now exports `lexer.ALL_KEYWORDS` and has a test
  that fails when this grammar does not highlight every entry, run from a
  checkout that has both repos.

## [0.1.0] — 2026-06-13

Initial release.

- Syntax highlighting for `.nd` files (keywords, types, strings with `\()` interpolation, DSL blocks, built-in functions, numeric literals including `42i` integer suffix)
- Both `//` and `#` comment styles supported
- Language configuration: bracket matching, auto-close, comment toggling, code folding
- **Nodus: Run File** command (`Ctrl+Alt+N`) — runs the current file in an integrated terminal
- **Nodus: Format File** command — runs `nodus fmt` and reloads the editor
- Status bar `▶ Nodus` button when editing a `.nd` file
- 17 code snippets: `fn`, `workflow`, `goal`, `step`, `stepafter`, `stepwith`, `import`, `tryc`, `trycf`, `if`, `ife`, `while`, `whilei`, `fori`, `spawn`, `channel`, `record`, `runwf`, `check`
- `nodus.executablePath` setting for custom nodus binary location
- `nodus.reuseTerminal` setting to reuse the run terminal between runs
