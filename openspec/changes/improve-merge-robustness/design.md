## Context
The application was recently migrated to Vue 3. The current merge logic in `src/utils/excel.js` is pure but has some rigid assumptions regarding key columns and conflict handling. The UI also uses generic labels that don't help users identify which file is which.

## Goals / Non-Goals
**Goals:**
- Ensure all rows are accounted for in the final output (no silent dropping of conflicts).
- Preserve unique key names from both sides in the merge result.
- Surface filenames in the UI for better clarity.
- Provide defensive parsing with basic error reporting.

**Non-Goals:**
- Rewriting the entire merge algorithm.
- Adding database persistence.
- Implementing a multi-file (3+) merge.

## Decisions

### 1. Default Conflict Resolution
**Decision**: Default to `first` (Keep First) if no resolution is provided in `conflictResolutions`.
**Rationale**: Dropping data is a worse failure mode than keeping only the first match. "Keep First" is a common default for unique-key joins.
**Alternative**: "Keep All" (Cartesian product). Considered but rejected as a default because it can lead to massive row explosions that might crash the browser.

### 2. Key Column Preservation in `resolveColumnNames`
**Decision**: If `keyColA !== keyColB`, include `keyColB` as a regular column from side B.
**Rationale**: Users often merge files where the key is named differently (e.g., "ID" and "Ref"). Seeing both keys in the result helps verify the join.
**Alternative**: Rename `keyColB` to something like `B_Key`. Rejected because it's less intuitive than keeping its original name if it doesn't collide.

### 3. Global Filename State
**Decision**: Add `filenameA` and `filenameB` to the `state` object in `useAppState.js`.
**Rationale**: Filenames are needed across multiple components (Upload, Sheets, Results). Component-local state is insufficient.

### 4. Basic Validation in `parseSheetWithOffset`
**Decision**: Return a `warnings` array or null headers if the sheet is clearly invalid (e.g., fewer rows than `startRow`).
**Rationale**: Prevents downstream failures by catching issues at the parsing stage.

## Risks / Trade-offs

- **[Risk]** If side B's key column is included and has the same name as another column in side A, it will be prefixed (e.g., `B_Ref`). This is already handled by `resolveColumnNames`.
- **[Trade-off]** Defaulting to "Keep First" might hide duplication issues. **Mitigation**: Keep the "Conflicts" tab badge red/visible to ensure the user knows conflicts occurred.
