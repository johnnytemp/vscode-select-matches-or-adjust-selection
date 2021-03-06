# Select Matches Or Adjust Selection README

This extension features a set of **"Select Matches"** commands. They let you search and select the matches by a regular expression (regex) (or literal string [#1](#footnote1)) - within the current selections, the whole document, or after cursors. *Predefined patterns* can also be used. With these commands, you could do jobs like shrink selections, extends selections, move selections, etc.

Besides, it has various commands to make or adjust selections. For example, it allows you to...

1. `Normalize Selection` which unselect surrounding whitespaces and expand the incomplete words.
2. Select a `#hashtag` or `$variable` with a keyboard shortcut.
3. Expand current selections' left/both boundaries by 1 character wide.

**Note**: By default, for the "Select Matches" commands, all matches in the regex are *case sensitive* [#2](#footnote2), and `^`, `$`  match *text selection boundaries* instead of line boundaries [#3](#footnote3).

## Features

- All commands support *multiple selections* or cursors to act on. (VS Code's built-in Find feature doesn't support this)
- Can assign keyboard shortcuts to specific criteria for productivity.
- Memorize last used search string or pattern name. (memory lost when program exits)
- Additional options to delete, align, or conditionally extend to, the matches found.
- Some useful default patterns. E.g. find next parentheses pair of regex, either literally or within JSON string; and find simple string.

## Commands & Demo

### "Select All Matches In Selection...", "Select Next Matches From Cursors..." and "Select Up To Next Matches From Cursors..."

![Select Matches In Selection or From Cursors](https://github.com/johnnytemp/vscode-select-matches-or-adjust-selection/raw/master/images/selectInSelectionOrFromCursors.gif)

`...From Cursors` meant to search from cursors or ends of selections onwards. `Select Up To...` will extend current selection if next match found. `Select All Matches...` commands will operate on the whole document if current selection is a single cursor.  
Selections without corresponding matches won't be kept.

Remark: "Select All Matches In Selection..." is similar to "Find All In Selection".

<br>

### "Select Matches Using Pattern (or input)..." (Shortcut: Ctrl-K Ctrl-;) and "Select All Matches In Line Selections..."

![Select Matches Using Pattern Or In Line Selections](https://github.com/johnnytemp/vscode-select-matches-or-adjust-selection/raw/master/images/selectByPatternOrInLineSelections.gif)

"Line Selections" meant the current text selections will be further split into one-line-each for searching the pattern inside.

Also, the "Select Matches Using Pattern (or input)..." -> "... Next Matches From Cursors..." options support a "Use Selected Text" entry to use the currently selected text as the search target (i.e. next occurrence).

<br>

### "Normalize Selection" (Shortcut: Ctrl-Shift-A)

![Normalize Selection](https://github.com/johnnytemp/vscode-select-matches-or-adjust-selection/raw/master/images/normalizeSelection.gif)

This operation unselect surrounding whitespaces, and it make incomplete words at selection boundaries to be complete. (Also, for empty-selection cursors, it jumps from inside word to word start; and jumps from inside spaces-and-tabs to the end of them)

<br>

### "Select Word and Its Prefix" (Shortcut: "Ctrl-K 4" for prefix `$`)

![Select Word and Its Prefix](https://github.com/johnnytemp/vscode-select-matches-or-adjust-selection/raw/master/images/selectWordAndItsPrefix.gif)

The word and the desired prefix (if any) at the start of each selection/cursor will be selected by extending selections.

<br>

### "Increment Selection Starts" (Shortcut: "Ctrl-K H"), "Increment Selection Starts and Ends" (Shortcut: "Ctrl-K L") and "Decrement Selection Starts and Ends" (Shortcut: "Ctrl-K Shift-L")

- "Increment Selection Starts" extends selection starts by 1 character.
- "Increment Selection Starts and Ends" extends both selection starts and ends by 1 character each.
- "Decrement Selection Starts and Ends" shrink both selection starts and ends by 1 character each.

## More Details

- This extension mainly use the regular expression that JavaScript support for search.

    E.g. "select all matches in selection for  `.+`" would mean select any non-empty string (excluding newline characters), in the selected text(s).

    For more information on regular expression, you may checkout:

    - https://medium.com/factory-mind/regex-tutorial-a-simple-cheatsheet-by-examples-649dc1c3f285

- You could also select only a substring of the match with the format "`?<skip group no.>,<select group no.>;`" in front of the regex input/parameter.

    E.g. An input "`?1,2;(<)(.*?)>`" will only select the text in-between a `< >` pair. "Group no" corresponds to regex's capture group. The "skip group" must start from the regex pattern's beginning and immediately followed by the "select group", otherwise the behavior is undefined.

- Furthermore, there are some additional options for all the "Select Matches" commands, such as *nth-occurrence* and `d` for delete. The "inline syntax" [#4](#footnote4) of them in the regex input box or `"find"` parameter is "`?[<nth-occurrence>][<option-flags>];<normal-regex>`". Current supported option flags are the following:

    - `d` - delete the selected matches.
    - `e` - e for extends (conditionally); only apply for "Select Next Matches From Cursors". This flag instruct the logic to (conditionally) extends non-empty selections if each visited occurrence (including the final match of each) is touching previous selection/occurrence.  
        E.g. if you search for "`?2e;\w+ ?`", and the selection is the "The " in "The Quick Brown Fox Jumps...", it will result in extended selection so that "The Quick Brown " is selected (because both occurrences "Quick " & "Brown " is touching each other and also with the selection). Without this `e` flag, "Brown " - the second occurrence - will be selected instead.
    - Experimental flags (may change in future):
        - `a` - a for align; align the selected matches (assume at most one per line) to the same column. Alignment is undefined if the assumption isn't true.
        - `M` - M for (forced) move; only apply for "Select Next Matches From Cursors" and "Select Up To Next Matches From Cursors". This flag roughly means "jump really to the next match instead of the current position's match". It forbids a match at exactly the cursor position for each empty selection (aka cursors). (For each non-empty selection(s), they are assumed the last match already. Thus the first search position - selection end - is valid for the "next match")

## Requirements

None.

## Extension Settings

This extension contributes the following settings:

- `selectMatchesOrAdjustSelection.patterns`: define the patterns to be used by the command `Select Matches Using Pattern (or input)...`

    E.g. to define a pattern which search newlines, add this to your settings file:

    ```
    "selectMatchesOrAdjustSelection.patterns": {
        "Test Pattern's Name": {
            "find": "\r?\n"
        }
    }
    ```

Hints:

- For how to define patterns in the configuration, you could look at the default patterns as examples. (`Ctrl-Shift-P` to open command palette, type "Open Default Settings (JSON)" & Enter, and search for `selectMatchesOrAdjustSelection.patterns`)
- To hide a default pattern, add `"Pattern's Name": false` inside `selectMatchesOrAdjustSelection.patterns`.
- You could make use of the default rules of the VS Code extension "Quick Replace In Selection" (by johnnywong), `Escape literal string for PCRE/extended regular expression` (optional) and then `Json stringify` and to put your regular expression in the `"find"` settings of `selectMatchesOrAdjustSelection.patterns`.
- An experimental feature: to only search the first match (instead of all matches) in each selection, put a leading "<code>?-g </code>" in the regex input box or `"find"` parameter.

## Default Patterns

Some default patterns are listed here:

- Line
- Regex's ()-pair (max 3 levels nested, experimental) [#5](#footnote5)
- Simple expression [#5](#footnote5)
- Simple string [#5](#footnote5)
- Whitespaces to non-whitespaces boundary
- Word

## Keyboard Shortcuts

- You could also define custom keyboard shortcuts for each command, e.g.:

    ```
    {
        "key": "alt+'",
        "command": "selectMatchesOrAdjustSelection.selectMatchesInSelection",
        "when": "editorTextFocus",
        "args": {
            "find": "'[^'\\r\\n]*'"
        }
    },
    {
        "key": "alt+shift+'",
        "command": "selectMatchesOrAdjustSelection.selectMatchesByPattern",
        "args": {
            "selectScope": "selectNextMatchesFromCursors",
            "patternName": "Simple string"
        }
    }
    ```

    - For `"selectScope"`, it is one of `"selectMatchesInSelection"`, `"selectMatchesInLineSelections"`, `"selectNextMatchesFromCursors"` and `"selectUpToNextMatchesFromCursors"`.
    - If `"patternName"` is not specified, it will prompt a picker to choose from.

## Known Issues

None.

## Release Notes

See [CHANGELOG.md](CHANGELOG.md)

## License

MIT - See [LICENSE](LICENSE)

## Footnotes

<a name="footnote1"></a>#1 - to search with a *literal string*, add a leading "`*`" in the regex input box.  
<a name="footnote2"></a>#2 - to do the opposite, type a leading "<code>?i </code>" before the regex in the input box (not a part of regex), or in the `"find"` value for patterns.  
<a name="footnote3"></a>#3 - to do the opposite, type a leading "`+`" (preferred) or "<code>?m </code>" before the regex in the input box (not a part of regex), or in the `"find"` value for patterns.  
<a name="footnote4"></a>#4 - Such complete "inline syntax" is:  

    "?" [<nth-occurrence>] [<option-flags>] [ "|" <skip group no.> "," <select group no.> ] ";" [ "?" <flags> " " | "+" | "*" ] <normal-regex>

    where [ optional-1 | optional-2 ] are optional branches; "characters" are literal characters; spaces are just for readability

<a name="footnote5"></a>#5 - these patterns are only expected to work in many basic cases. They have limitations and fail to work for more complicate cases. Thus, use them with inspection and at your own risk.  
