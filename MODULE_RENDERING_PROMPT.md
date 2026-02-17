# Module Rendering Architecture — Implementation Prompt

## Context

We're building a custom closet configurator using Next.js 16, TypeScript, Tailwind CSS, and Three.js (via @react-three/fiber and @react-three/drei). The configurator renders closets in 3D where users select module layouts that fill slots inside a closet corpus.

The current implementation (`ThreeCanvas.tsx`) scales entire GLB models uniformly, which breaks when height changes — shelf spacing stretches, drawers distort, rods move to wrong heights. We need a new architecture.

## The Problem

When module height increases (e.g. from 200cm to 250cm), scaling the GLB in Y stretches everything: shelf gaps, drawer heights, rod positions. We need fixed-size "special elements" (the unique parts like rods, drawers, divider sections) combined with programmatically generated shelves that fill the remaining space.

## Architecture Overview

### Mental Model

Every module layout consists of exactly two conceptual parts:

1. **Special Element** — A fixed-height 3D model (GLB) containing the unique geometry for that layout: rods, drawers, half-width vertical dividers, internal shelves that are part of the fixed section, etc. This element **never scales in Y**. It only scales in X (width) and Z (depth) to fit the slot.

2. **Fill Zone(s)** — The remaining vertical space in the module, filled either with evenly-spaced shelves (programmatic box geometries) or left open (empty). Fill zones absorb all height variation.

### Anchor System

The special element can be anchored in three ways:

```
anchor:
  | { type: 'bottom' }                     // element sits at the bottom of the module
  | { type: 'top' }                        // element sits at the top of the module
  | { type: 'fixed', fromBottom: number }   // element placed at a specific Y (meters from module floor)
```

- **`bottom`**: One fill zone above the special element.
- **`top`**: One fill zone below the special element.
- **`fixed`**: Two fill zones — one below and one above the special element. This is used for rod sections where the rod must hang at a usable height regardless of total module height.

### Visual Diagram

```
Example: anchor = { type: 'fixed', fromBottom: 1.0 }

┌─────────────┐ ← module top (moduleHeight)
│             │
│  FILL ZONE  │ ← above: shelves or open
│  (above)    │
│             │
├─────────────┤ ← fromBottom + specialElement.height
│  SPECIAL    │
│  ELEMENT    │ ← GLB model (fixed height, no Y scaling)
│  (GLB)      │
├─────────────┤ ← fromBottom (1.0m from floor)
│             │
│  FILL ZONE  │ ← below: shelves or open
│  (below)    │
│             │
└─────────────┘ ← module bottom (0)


Example: anchor = { type: 'bottom' }

┌─────────────┐ ← module top
│             │
│  FILL ZONE  │ ← shelves or open
│             │
├─────────────┤ ← specialElement.height
│  SPECIAL    │
│  ELEMENT    │ ← GLB model at bottom
└─────────────┘ ← 0


Example: anchor = { type: 'top' }

┌─────────────┐ ← module top
│  SPECIAL    │
│  ELEMENT    │ ← GLB model at top
├─────────────┤ ← moduleHeight - specialElement.height
│             │
│  FILL ZONE  │ ← shelves or open
│             │
└─────────────┘ ← 0
```

## Type Definitions

Create a `moduleLayouts.ts` (or similar) file for the layout registry:

```typescript
// --- Anchor types ---
type AnchorBottom = { type: 'bottom' }
type AnchorTop = { type: 'top' }
type AnchorFixed = { type: 'fixed'; fromBottom: number } // meters from module floor

type Anchor = AnchorBottom | AnchorTop | AnchorFixed

// --- Fill zone types ---
type FillShelves = { type: 'shelves'; spacing: number } // spacing in meters
type FillOpen = { type: 'open' }

type FillZoneConfig = FillShelves | FillOpen

// --- Module layout definition ---
type ModuleLayout = {
  id: number
  label: string                          // human-readable name (e.g. "Rod + 3 shelves")

  specialElement: {
    glbPath: string                      // path to GLB file (e.g. '/objects/special/rod-half.glb')
    height: number                       // fixed height in meters (measured from GLB)
    anchor: Anchor                       // where to place vertically
    baseWidth: number                    // reference GLB X dimension for width scaling
    baseDepth: number                    // reference GLB Z dimension for depth scaling
  }

  fillZone: {
    above: FillZoneConfig                // fill zone above special element (ignored for 'top' anchor)
    below: FillZoneConfig                // fill zone below special element (ignored for 'bottom' anchor)
  }
}
```

### Example Layout Entries

```typescript
const MODULE_LAYOUTS: ModuleLayout[] = [
  {
    id: 1,
    label: 'Full shelves',
    specialElement: {
      glbPath: '/objects/special/empty.glb', // or handle as special case with no GLB
      height: 0,
      anchor: { type: 'bottom' },
      baseWidth: 0.575,
      baseDepth: 0.6,
    },
    fillZone: {
      above: { type: 'shelves', spacing: 0.30 },
      below: { type: 'open' },
    },
  },
  {
    id: 2,
    label: 'Rod section bottom + shelves above',
    specialElement: {
      glbPath: '/objects/special/rod-full.glb',
      height: 0.85,
      anchor: { type: 'bottom' },
      baseWidth: 0.575,
      baseDepth: 0.6,
    },
    fillZone: {
      above: { type: 'shelves', spacing: 0.30 },
      below: { type: 'open' },
    },
  },
  {
    id: 3,
    label: 'Rod at fixed height + open below',
    specialElement: {
      glbPath: '/objects/special/rod-half-divider.glb',
      height: 0.85,
      anchor: { type: 'fixed', fromBottom: 1.0 },
      baseWidth: 0.575,
      baseDepth: 0.6,
    },
    fillZone: {
      above: { type: 'shelves', spacing: 0.30 },
      below: { type: 'open' },
    },
  },
  {
    id: 4,
    label: 'Drawers at bottom + shelves above',
    specialElement: {
      glbPath: '/objects/special/drawers-3.glb',
      height: 0.60,
      anchor: { type: 'bottom' },
      baseWidth: 0.575,
      baseDepth: 0.6,
    },
    fillZone: {
      above: { type: 'shelves', spacing: 0.30 },
      below: { type: 'open' },
    },
  },
]
```

**Note:** These are illustrative examples. The actual layout entries will be created based on real GLB measurements once the models are ready. The system must support adding new layouts by simply adding an entry + providing a GLB — no renderer changes.

## Rendering Logic — How the Module Component Should Work

### Step 1: Determine positions

```
Given: moduleHeight, layout (from registry)

Based on anchor type, calculate:
  - specialElementY: Y position of the special element's bottom edge
  - fillAboveStart / fillAboveEnd: Y range for the above fill zone
  - fillBelowStart / fillBelowEnd: Y range for the below fill zone

For anchor 'bottom':
  specialElementY = 0
  fillAboveStart = specialElement.height
  fillAboveEnd = moduleHeight

For anchor 'top':
  specialElementY = moduleHeight - specialElement.height
  fillBelowStart = 0
  fillBelowEnd = moduleHeight - specialElement.height

For anchor 'fixed':
  specialElementY = anchor.fromBottom
  fillBelowStart = 0
  fillBelowEnd = anchor.fromBottom
  fillAboveStart = anchor.fromBottom + specialElement.height
  fillAboveEnd = moduleHeight
```

### Step 2: Render special element (GLB)

- Load GLB via `useGLTF`
- Clone the scene
- Scale geometry in X and Z only (width and depth) — **never scale Y**
- Position at `specialElementY`
- Handle door rotations if the GLB contains doors (check for mesh names like 'Deur')

```
scaleX = targetSlotWidth / layout.specialElement.baseWidth
scaleZ = targetDepth / layout.specialElement.baseDepth
// Y scale = 1.0 (never touch)
```

### Step 3: Render fill zones

For each fill zone that has `type: 'shelves'`:
- Calculate number of shelves: `Math.floor(zoneHeight / spacing) - 1` (or similar — ensure shelves don't overlap zone boundaries)
- Distribute shelves evenly within the zone
- Each shelf is a `<mesh>` with `<boxGeometry>` (width × plankThickness × depth)

For `type: 'open'`: render nothing in that zone.

### Shelf generation specifics:
- Shelf thickness: ~0.025m (2.5cm)
- Shelves should not be placed at the very top or very bottom of a fill zone (those boundaries are the special element or the module edge)
- Shelf width = slot width (inner module width for that slot)
- Shelf depth = module depth minus back wall

## GLB Authoring Rules (For Blender)

These rules ensure GLBs work correctly with the renderer:

1. **Model only the special element** — no outer side panels (those are the corpus)
2. **Author at natural/real-world size** — the GLB height IS the `specialElement.height` value
3. **Origin at bottom-left-back corner** — consistent with the current positioning system
4. **Reference dimensions**: Author at a consistent base width and depth (e.g. 0.575m × 0.6m). Record these as `baseWidth` and `baseDepth` in the layout config.
5. **Mesh naming convention**:
   - Doors: include `Deur` in the mesh name (for open/close animation)
   - Rods: include `Rod` or `Stang` in the mesh name
   - Drawers: include `Lade` in the mesh name
   - Side panels/dividers within the special element: include `Divider` or `Tussenschot`
6. **No vertical scaling will be applied** — the model must be the correct height as authored
7. **Width and depth will be scaled** — avoid geometry that would look bad when stretched in X/Z (e.g. circular handles might distort; keep those as separate children if needed)

## Integration with Existing Code

### What to keep from current `ThreeCanvas.tsx`:
- `ClosetCorpus` component (outer shell) — keep as-is
- `TopCabinet` component — keep as-is
- `FloorGrid` component — keep as-is
- `ClosetScene` orchestration — keep, but update Module rendering
- Canvas setup, WebGPU renderer, OrbitControls — keep as-is
- Door toggle button — keep as-is

### What to refactor:
- **`Module` component** — completely rewrite to use the new architecture (special element + fill zones)
- **Remove `ExtraPlanks` component** — replaced by the new fill zone shelf generation
- **Remove `MODULE_PATHS` constant** — replaced by the layout registry
- **Remove `BASE_WIDTH`, `BASE_HEIGHT`, `BASE_DEPTH` constants** — each layout now carries its own reference dimensions
- **Remove direct geometry scaling in Y** — the current `wallScaleY` approach is eliminated

### Zustand store considerations:
- The store's `modules` array should reference layout IDs that map to the new `ModuleLayout` registry
- The store likely already has `moduleCount`, `width`, `height`, `depth`, `mainHeight()`, `doorsOpen` — all of these are still needed
- If the store doesn't have per-module layout assignment, it needs it (each slot maps to a `layoutId`)

### File structure suggestion:
```
src/
  components/
    configurator/
      ThreeCanvas.tsx          ← main canvas (updated Module component)
      moduleLayouts.ts         ← ModuleLayout type + MODULE_LAYOUTS registry
      FillZone.tsx             ← shelf generation component (reusable)
      SpecialElement.tsx       ← GLB loader/scaler for special elements
```

## Important Constraints

1. **WALL constant** = 0.05m (5cm) — used for corpus wall thickness, affects inner dimensions
2. **Module slot width** = `(closetWidth - 2 * WALL) / moduleCount` — inner width divided by slots
3. **Module height** = `mainHeight - 2 * WALL` — inner height (between top and bottom panels of corpus)
4. **Module depth** = `closetDepth - WALL` — inner depth (from front to back wall)
5. **The corpus provides the outer walls** — module GLBs should NOT include outer side panels
6. **WebGPU renderer** is being used (with `forceWebGL: true` fallback) — standard Three.js materials work fine
7. **Preload all GLBs** — use `useGLTF.preload()` for all paths in the registry

## What NOT to Change

- Do not modify the corpus rendering
- Do not modify the top cabinet logic
- Do not change the canvas/renderer setup
- Do not change the Zustand store structure beyond what's needed for layout IDs
- Do not introduce new dependencies unless absolutely necessary

## Summary

The goal is a **data-driven module rendering system** where:
- Adding a new module layout = 1 GLB file + 1 config entry in the registry
- The renderer handles all layout types generically based on the config
- Height variations are absorbed by fill zones, not by stretching GLBs
- Special elements maintain their exact authored dimensions
- The system is clean, typed, and easy to extend over time
