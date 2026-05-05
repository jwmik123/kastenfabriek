# 056 — Sanity `bodyColor` + LEATHERS registry + multi-mesh handle rendering

## Parent

PRD: [issues/prd-doorhandles-grid-and-materials.md](./prd-doorhandles-grid-and-materials.md)

## What to build

Add support for handles that combine a fixed leather body with a customer-selected metal knob. Introduce a named `LEATHERS` registry (4 colours: skincolor pink, beige, light gray, black) in code, expose a matching `bodyColor` enum field in Sanity, and update `Handles.jsx` to traverse multi-mesh handles, applying the leather body material to non-knob meshes and the variable metal material to meshes whose names contain `knob`. Single-mesh handles (no `bodyColor`) keep today's behaviour exactly.

## Acceptance criteria

**Code registry**

- [ ] `_shared/constants/handleMaterials.ts` exports a `LEATHERS` registry with 4 entries: `leather-pink`, `leather-beige`, `leather-light-gray`, `leather-black`
- [ ] Each entry contains: `id`, Dutch label, and hex value
- [ ] `LeatherColor` type union exported from the same module

**Schema + data**

- [ ] `sanity/schemaTypes/handle.ts` adds an optional `bodyColor` field: single string with `options.list` enumerating the 4 leather ids
- [ ] GROQ projection in `lib/configurator/queries.ts` returns `bodyColor` on each handle
- [ ] `HandleType` gains `bodyColor?: LeatherColor`

**Multi-mesh rendering**

- [ ] `Handles.jsx` (or its replacement) inspects the resolved GLB node:
  - If the node contains child meshes whose names include `knob`, those meshes receive the variable metal material; remaining children of the same node receive a leather material constructed from the entry's hex (`MeshStandardMaterial`, low metalness, mid-high roughness, no texture)
  - Otherwise (single mesh, no children, or `bodyColor` absent), the entire geometry receives the variable metal material — today's behaviour preserved exactly
- [ ] Leather material is built per-render keyed on `bodyColor`; metal materials remain memoised once via the registry from slice 054
- [ ] No changes to the pricing engine; finishes remain priced identically

**Verification**

- [ ] Verified manually with a multi-mesh test handle (GLB authored with at least one mesh whose name contains `knob` and at least one body mesh): switching metal swatches changes only the knob; setting different `bodyColor` values in Studio updates the body without reloading
- [ ] Verified manually that all existing single-mesh handles render unchanged

## Blocked by

- Blocked by #055
