# Project Memory

## Kastenfabriek — Configurator Architecture

### Folder Structure (implemented)

```
app/(main)/(bouw-je-kast)/
├── _shared/                        # Shared across ALL configurators (underscore = not a Next.js route)
│   ├── canvas/
│   │   ├── ThreeCanvas.tsx         # Base canvas: WebGPU renderer, directional light, HDR env
│   │   ├── CameraController.tsx    # GSAP-animated camera distance
│   │   ├── SceneEnvironment.tsx    # HDR env map loader
│   │   └── ThreeLoader.tsx         # Loading screen with progress animation
│   ├── materials/
│   │   └── ClosetMaterial.tsx      # Material context/provider/hook (oak + solid colors)
│   ├── objects/
│   │   ├── Door.tsx                # Door panel with hinges and handles
│   │   ├── Handles.jsx             # Handle GLB picker (HANDLE_TYPES export)
│   │   └── Hinge.jsx               # Animated hinge GLB
│   └── effects/
│       ├── PostProcessing.tsx      # WebGPU post-processing with AO
│       └── GTAOEffect.tsx          # GTAO ambient occlusion
│
├── kledingkast/
│   ├── store.ts                    # Zustand state (dimensions, modules, materials, steps)
│   ├── materials.ts                # MATERIALS array + MATERIAL_COLORS map
│   ├── scene/
│   │   ├── KledingkastCanvas.tsx   # Top-level canvas: wires ThreeCanvas + closet scene + overlays
│   │   ├── ClosetScene.tsx         # Scene graph root + ModuleSlotInteraction
│   │   ├── ClosetCorpus.tsx        # Box geometry (walls, top, back)
│   │   ├── TopCabinet.tsx          # Optional top cabinet (height > 275cm)
│   │   ├── OnderstelPlinth.tsx     # GLB plinth/base
│   │   ├── Module.tsx              # Single module slot (layout + fill zones + door)
│   │   ├── FillZone.tsx            # Shelf placement logic
│   │   ├── SpecialElement.tsx      # GLB module elements with scaling/animation
│   │   ├── SilhouettePlane.tsx     # Person silhouette reference plane
│   │   └── moduleLayouts.ts        # Layout registry + computeModulePositions
│   ├── steps/
│   │   ├── DimensionsStep.tsx
│   │   ├── ModulesStep.tsx
│   │   ├── MaterialStep.tsx
│   │   └── DoorHandlesStep.tsx
│   └── components/
│       ├── KledingkastConfigurator.tsx  # Top-level UI (canvas + wizard layout)
│       ├── StepWizard.tsx               # Multi-step wizard UI
│       ├── CanvasToolbar.tsx            # Zoom/door/measurements toolbar overlay
│       ├── Measurements.tsx             # 3D measurement projection + DOM overlay
│       └── LayoutSvgs.tsx              # SVG icons for module layout picker
```

### Key Patterns
- `_shared/materials/ClosetMaterial.tsx` reads from `kledingkast/store` — when building the next configurator, refactor to accept materialId as prop
- `KledingkastCanvas` imports `ThreeCanvas` from `_shared/canvas/` and passes scene content as children
- Shadow planes (wall + floor) live in `KledingkastCanvas`, not in the shared `ThreeCanvas`
- `CanvasToolbar` and `Measurements` stay in `kledingkast/components/` — they are coupled to the kledingkast store

### Tech Stack
- Three.js WebGPU renderer (`three/webgpu`)
- React Three Fiber + Drei
- Zustand for state
- GSAP for animations
- Next.js App Router
