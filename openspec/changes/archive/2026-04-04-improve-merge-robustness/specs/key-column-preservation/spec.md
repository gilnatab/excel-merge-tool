## ADDED Requirements

### Requirement: Unique side B key column inclusion
The system SHALL include the key column from side B in the merged output if its name is different from the key column name of side A.

#### Scenario: Differing key names
- **WHEN** side A key is "ID" and side B key is "Ref"
- **THEN** the merged output SHALL contain both an "ID" column and a "Ref" column
- **AND** for matched rows, both columns SHALL contain the same logical key value from their respective sources

### Requirement: Conflicting side B key column handling
If side B's key column name matches side A's key column name, the system SHALL only include one instance of the key in the final merged output.

#### Scenario: Identical key names
- **WHEN** side A key is "ID" and side B key is "ID"
- **THEN** the merged output SHALL contain only one "ID" column
