## ADDED Requirements

### Requirement: Default conflict resolution
The system SHALL default to the "first" (Keep First) resolution for any duplicate key conflicts that have not been explicitly resolved by the user.

#### Scenario: Unhandled conflict in output
- **WHEN** the user starts a merge that results in conflicts
- **AND** the user does not select a resolution for a specific conflict key
- **AND** the user downloads the result
- **THEN** the output SHALL include the merged row using the first available match from side A and side B for that key

### Requirement: Conflict status warning
The system SHALL provide a visible warning in the "处理结果" step (Step 5) if there are any unhandled duplicate key conflicts.

#### Scenario: Error styling for unhandled conflicts
- **WHEN** there are unhandled conflicts in the merge result
- **THEN** the "存在冲突" stat card SHALL be styled in an error/warning color (e.g., `text-error`) to indicate action is needed
- **AND** the conflict count shown on the card SHALL reflect the total number of conflict keys

### Note: UI pattern change
The conflict indicator was previously a tab with a badge. It is now a **clickable stat card** at the top of Step 5. Clicking the card sets `state.ui.activeView = 'conflicts'` to show the conflict resolution panel. The warning color logic applies to both the stat card icon and the count text when `unhandledConflictsCount > 0`.
