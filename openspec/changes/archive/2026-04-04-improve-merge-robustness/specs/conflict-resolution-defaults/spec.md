## ADDED Requirements

### Requirement: Default conflict resolution
The system SHALL default to the "first" (Keep First) resolution for any duplicate key conflicts that have not been explicitly resolved by the user.

#### Scenario: Unhandled conflict in output
- **WHEN** the user starts a merge that results in conflicts
- **AND** the user does not select a resolution for a specific conflict key
- **AND** the user downloads the result
- **THEN** the output SHALL include the merged row using the first available match from side A and side B for that key

### Requirement: Conflict status warning
The system SHALL provide a visible warning in the "Results" step if there are any unhandled duplicate key conflicts.

#### Scenario: Red badge for unhandled conflicts
- **WHEN** there are unhandled conflicts in the merge result
- **THEN** the "重复键冲突" tab badge SHALL be styled to indicate a warning state (e.g., red background)
