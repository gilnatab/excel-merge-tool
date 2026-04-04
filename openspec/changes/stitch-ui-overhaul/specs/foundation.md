# Spec: Foundation — style.css + AppIcon.vue

## style.css

### Changes
- Replace existing `@theme` tokens (4 colors) with full Precision Layer token set (16 color vars + font stack)
- Keep `@import "tailwindcss"` as first line
- Add base `font-family` override on `body` via `@layer base`
- Keep existing transition CSS

### Token Spec
```css
@theme {
  --color-surface: #f8f9ff;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #eff4ff;
  --color-surface-container: #e5eeff;
  --color-surface-container-high: #dce9ff;
  --color-surface-container-highest: #d3e4fe;
  --color-primary: #0058be;
  --color-primary-container: #2170e4;
  --color-primary-fixed: #d8e2ff;
  --color-on-primary: #ffffff;
  --color-on-surface: #0b1c30;
  --color-on-surface-variant: #424754;
  --color-outline-variant: #c2c6d6;
  --color-error: #ba1a1a;
  --color-secondary: #495e8a;
  --color-tertiary: #924700;
  --font-family-sans: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

@layer base {
  body {
    font-family: var(--font-family-sans);
    background-color: var(--color-surface);
    color: var(--color-on-surface);
  }
}
```

### Invariants
- All color tokens are all-lowercase, kebab-case
- No `tailwind.config.js` introduced
- `--color-primary` (old) is replaced (value changes from `#4361EE` to `#0058be`)

---

## AppIcon.vue

### Spec
- New file: `src/components/AppIcon.vue`
- Props: `name: { type: String, required: true }`
- Uses `inheritAttrs: false` — `$attrs` forwarded to `<svg>` for class/style
- SVG: `viewBox="0 0 24 24"` `fill="currentColor"` `aria-hidden="true"`
- Single `<path :d="paths[name]" />`
- If `name` not in registry: renders empty `<svg>` (no error thrown)

### Icon Registry (25 entries)
All path data from Material Icons outlined style, 24×24 grid:
- check, arrow_forward, arrow_back, refresh, cloud_upload, task_alt, info, grid_on, visibility, close, search, filter_list, chevron_left, chevron_right, description, link, lock, expand_more, report, settings, download, autorenew, open_in_full, add_circle, sync_alt

### Usage
```vue
<AppIcon name="download" class="w-5 h-5" />
<AppIcon name="close" class="w-4 h-4 text-on-surface-variant" />
```

### PBT
- `name` not in registry → silent empty SVG, no thrown error
- `class` forwarded to svg element (verified via $attrs)
