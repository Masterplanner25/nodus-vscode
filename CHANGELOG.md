# Changelog

## [0.1.2] — 2026-08-17

- Highlight the five `goal` keywords added in nodus-lang v5.0.0: `over`,
  `until`, `budget`, `reached` and `retry`, plus the `budget` option names
  `max_iterations` and `deadline_ms`
  ([nodus-lang#409](https://github.com/Masterplanner25/Nodus/issues/409)).

  ```nd
  goal reach_quality over tune {
      until reached("good_enough")
      budget { max_iterations: 5, deadline_ms: 30000 }
  }
  ```

  Same reason as 0.1.1: they are *contextual* keywords, so without this they
  render as plain identifiers and the syntax reads as not-yet-real. nodus-lang's
  `test_keyword_coverage.py` caught the omission the moment the keywords were
  added — which is the guard that release added after `match`/`break`/`continue`
  shipped unhighlighted for two releases.

- New snippet: `goalover` scaffolds the stopping-condition form, alongside the
  existing `goal` snippet for the step-containing form. Both remain valid.

- README now says `nodus --version` should print `5.x.x`.


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
