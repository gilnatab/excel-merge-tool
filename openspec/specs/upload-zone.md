# Spec: Native Upload Zone (Step1Upload.vue)

## Invariants

- One `processFile(which, file)` function is the single entry point for both paths
- Upload success state is set only after `FileReader.onload` completes — never optimistically
- After `onReset(which)`, the native file input value is cleared so re-selecting the same file fires `change`
- Drag-and-drop and click-to-browse cannot trigger duplicate uploads (shared handler, no double-call)
- Multi-file drops: only `files[0]` is processed; extras are silently ignored

## State Per Slot

```js
const dragState  = reactive({ A: false, B: false })  // isDragging visual
const fileInputs = reactive({ A: null,  B: null  })  // template refs
```

## Event Contract

| Event | Handler | Side effect |
|-------|---------|-------------|
| `click` on zone | `triggerInput(which)` | `fileInputs[which].click()` |
| `change` on input | `onFileChange(which, e)` | `processFile(which, e.target.files[0])` |
| `dragover.prevent` | inline | `dragState[which] = true` |
| `dragleave.prevent` | inline | `dragState[which] = false` |
| `drop.prevent` | `onDrop(which, e)` | `dragState[which] = false`, `processFile(which, e.dataTransfer.files[0])` |

## Reset Behavior

```js
function onReset(which) {
  if (fileInputs[which]) fileInputs[which].value = '';  // clear for same-file re-select
  resetFile(which);                                      // from useAppState
}
```

## Upload Zone CSS States (Precision Layer tokens)

| State | Classes |
|-------|---------|
| Default | `border-2 border-dashed border-primary-fixed rounded-2xl` |
| Dragging | `border-primary bg-primary-fixed/30` |
| Hover | `hover:border-primary hover:bg-surface-container-low` |

## Success State

When a file is loaded, the upload zone is replaced by a success card:
- Emerald border: `border-2 border-emerald-200 bg-emerald-50`
- `task_alt` icon via `<AppIcon name="task_alt" />`
- Filename displayed, "重新上传" reset button

## PBT Properties

- **No-op on empty drop**: `e.dataTransfer.files.length === 0` → no state change
- **Idempotent reset**: calling `onReset` twice leaves state identical to once
- **Single-path invariant**: same `handleFileUpload()` call regardless of click vs drag
- **Re-select invariant**: after reset, selecting the same filename fires `change` event
