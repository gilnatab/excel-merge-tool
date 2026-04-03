## ADDED Requirements

### Requirement: Filename persistence in state
The system SHALL store the names of the two uploaded files in the global application state.

#### Scenario: File upload stores name
- **WHEN** the user uploads a file for side A or B
- **THEN** its filename SHALL be captured and stored in `useAppState`

### Requirement: Filename usage in results
The system SHALL use the stored filenames instead of generic labels (like "File A" and "File B") in the merge results display.

#### Scenario: Results display filenames
- **WHEN** the user is in Step 5 (Results)
- **THEN** the unmatched data sections SHALL show the filenames (e.g., "Only in [file1.xlsx]")
