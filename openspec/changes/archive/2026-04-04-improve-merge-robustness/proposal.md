## Why

The current Excel merge tool has several design gaps that can lead to data loss or a confusing user experience: unhandled duplicate key conflicts are silently dropped from the final output, side B's key column is always excluded from the merged result even if it has a different name than side A's key, and the UI lacks context by using generic "File A/B" labels instead of actual filenames.

## What Changes

- **Conflict Handling**: Default to "Keep First" for all unhandled conflicts instead of dropping them. Add a visual warning (red badge) to the Conflicts tab if unhandled conflicts exist.
- **Key Column Inclusion**: Modify the merge logic to include side B's key column in the output if its name differs from side A's key.
- **Filename Persistence**: Move uploaded filenames to the global state and use them in the UI (Steps 1, 2, and 5) for better context.
- **Validation & Feedback**: Add basic validation to `parseSheetWithOffset` and provide visual feedback during the merge process.

## Capabilities

### New Capabilities
- `conflict-resolution-defaults`: Ensures that all merge conflicts have a fallback resolution to prevent data loss.
- `key-column-preservation`: Retains side B's key column in the final output when it has a unique name.
- `filename-context`: Provides global access to uploaded filenames for UI labeling and reporting.

### Modified Capabilities
- (None)

## Impact

- `src/utils/excel.js`: `resolveColumnNames`, `buildFinalOutput`, `parseSheetWithOffset`.
- `src/composables/useAppState.js`: State shape (add filenames), `runMerge` (default resolutions).
- `src/components/Step1Upload.vue`: Update state with filenames.
- `src/components/Step5Results.vue`: UI for conflicts and filenames.
