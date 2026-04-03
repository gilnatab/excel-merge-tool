## 1. Global State & Filenames

- [x] 1.1 Add `filenameA` and `filenameB` to the `state` object in `src/composables/useAppState.js`.
- [x] 1.2 Update `handleFileUpload` in `useAppState.js` to accept the filename and store it in the state.
- [x] 1.3 Update `Step1Upload.vue` to pass the filename to `handleFileUpload` and remove local `filenameA/B` refs.
- [x] 1.4 Update `Step5Results.vue` to use `state.filenameA/B` in the unmatched data section labels.

## 2. Merge Logic Enhancements

- [x] 2.1 Modify `resolveColumnNames` in `src/utils/excel.js` to include `keyColB` if its name is different from `keyColA`.
- [x] 2.2 Update `buildFinalOutput` in `src/utils/excel.js` to use `first` as the default resolution for any unhandled conflict keys.
- [x] 2.3 Add basic validation to `parseSheetWithOffset` in `src/utils/excel.js` (e.g., check if `startRow` is within bounds).

## 3. UI Feedback & Refinement

- [x] 3.1 Update the "重复键冲突" tab badge in `Step5Results.vue` to show a red background if there are unhandled conflicts.
- [x] 3.2 Add a "Processing..." overlay or state during `runMerge` to handle potential main-thread lag.

## 4. Verification

- [x] 4.1 Update `test/core.test.js` to include tests for the updated `resolveColumnNames` (key B inclusion).
- [x] 4.2 Add a new test case for `buildFinalOutput` to verify default conflict resolution.
- [x] 4.3 Run `npm test` and verify all tests pass.
