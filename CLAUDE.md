# Excel Merge Tool

## Architecture
- Single HTML file (`index.html`), no build step
- All HTML/CSS/JS inline
- External dependency: SheetJS CDN (xlsx-0.20.3)
- UI language: Chinese

## State-driven 5-step wizard
1. Upload files (A & B)
2. Select sheets + header row + optional all-sheets merge
3. Select key (join) column per file — **linked/per-sheet mode toggle** (linked shares one selection across all sheets; per-sheet allows independent selections)
4. Select merge columns (with search/filter) — same linked/per-sheet toggle
5. Results: **3 tabs** — matched (1:1 joins), unmatched (checkbox selection for inclusion), conflicts (N:M duplicates with keep-all/keep-first/remove resolution) → download as **Excel (.xlsx) or CSV**

## Coding conventions
- Use `escHtml()` for HTML content, `escAttr()` for attribute values (XSS prevention)
- Use numeric indices (`data-ci` attributes) for dynamic DOM IDs — never use raw key values as IDs
- Inline `onclick` handlers use numeric indices only
- Key comparison: `String(value).trim()`; rows with empty/missing keys are treated as unmatched
- Empty rows (all-whitespace) are filtered out during sheet parsing
- `parseSheetWithOffset()` handles configurable header row (1-indexed user input)
- Multi-sheet merge via `combineSheetData()` unions columns across checked sheets
- CSV download includes UTF-8 BOM for Chinese compatibility
- Column name collisions: prefix with `A_` / `B_`
