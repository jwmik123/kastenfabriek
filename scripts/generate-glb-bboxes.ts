import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { getBounds } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3d'
import { MODULE_LAYOUTS } from '@/app/(configurator)/kledingkast/scene/moduleLayouts'
import { WASM_MODULE_LAYOUT_CONFIGS } from '@/app/(configurator)/wasmachinekast/moduleLayoutConfigs'

/**
 * Measure the Y-extents of every module GLB and write them to
 * lib/order/glb-bboxes.json.
 *
 * The 3D scene positions drawers, rods and desks by loading each GLB and
 * reading its bounding box; the 2D order drawing cannot load GLBs at render
 * time, so the boxes are measured once here — with the same geometry the scene
 * uses — and checked in. Rerun after adding or reshaping a module GLB:
 *
 *   npm run generate:glb-bboxes
 */
async function main() {
  const paths = new Set<string>()
  for (const layout of [...MODULE_LAYOUTS, ...WASM_MODULE_LAYOUT_CONFIGS]) {
    for (const el of layout.elements) paths.add(el.glbPath)
  }

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
    })

  const out: Record<string, { minY: number; maxY: number }> = {}
  for (const p of [...paths].sort()) {
    const doc = await io.read(join(process.cwd(), 'public', p))
    const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0]
    const { min, max } = getBounds(scene)
    out[p] = { minY: round(min[1]), maxY: round(max[1]) }
    console.log(p.padEnd(52), `[${out[p].minY}, ${out[p].maxY}]`)
  }

  const file = join(process.cwd(), 'lib/order/glb-bboxes.json')
  writeFileSync(file, JSON.stringify(out, null, 2) + '\n')
  console.log(`\n${Object.keys(out).length} GLB's → ${file}`)
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000
}

main().catch((e) => { console.error(e); process.exit(1) })
