# Spec: Icon Registry (AppIcon.vue)

## Purpose

Provides all icons used across the app as inline SVG, avoiding CDN icon fonts and external dependencies. Required for offline / single-file distribution.

## Component Interface

```vue
<AppIcon name="check" class="w-5 h-5 text-primary" />
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | String | yes | Key into the internal `paths` map |

- No slots, no emits
- Uses `inheritAttrs: false` — `$attrs` forwarded to `<svg>` for `class`/`style` sizing
- SVG: `viewBox="0 0 24 24"` `fill="currentColor"`
- Single `<path :d="paths[name]" />`
- If `name` not in registry: renders empty `<svg>`, no error thrown

## Registered Icons (25)

All paths from Material Icons Outlined, 24×24 grid:

| Name | Usage |
|------|-------|
| `check` | Step indicator completed state, config badges |
| `arrow_forward` | Next button |
| `arrow_back` | Prev button |
| `refresh` | Re-upload button |
| `cloud_upload` | Upload zone |
| `task_alt` | Upload success state |
| `info` | Info boxes |
| `grid_on` | App logo, empty preview state |
| `visibility` | Sheet preview button |
| `close` | Fullscreen close, modal dismiss |
| `search` | Search inputs |
| `filter_list` | Unmatched stat card icon |
| `chevron_left` | Navigation (reserved) |
| `chevron_right` | Navigation (reserved) |
| `description` | Sheet item in sidebar |
| `link` | Key column section header |
| `lock` | Locked join-key row in Step 4 |
| `expand_more` | Expand toggle (reserved) |
| `report` | Conflict stat card, error states |
| `settings` | Export settings header |
| `download` | Download buttons |
| `autorenew` | Reset / reprocess button |
| `open_in_full` | Fullscreen expand trigger |
| `add_circle` | Add action (reserved) |
| `sync_alt` | Sync-all toggle |

## Invariants

- No CDN links — all paths are hardcoded strings
- Adding a new icon requires adding one entry to the `paths` object in `AppIcon.vue`
- Size is controlled entirely by the consumer's `class` (e.g. `w-4 h-4`, `w-6 h-6`)
- Color is controlled by `text-*` utilities via `fill="currentColor"`

## PBT

- `name` not in registry → silent empty SVG, no thrown error
- `class` applied to `<svg>` element (verified via `$attrs` forwarding)
- All 25 registered names render a non-empty path string
