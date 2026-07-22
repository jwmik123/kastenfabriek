// Renames bottom drawer-front nodes with an `_extend` suffix.
//
// Convention (PRD "finishing touches"): meshes whose name ends in `_extend`
// are stretched by the scene (SpecialElement) so their bottom edge lands 2 cm
// above the room floor when "deuren tot vloer" is enabled. Apply the same
// suffix in future GLB exports to opt a mesh into this behavior.
//
// Idempotent: skips nodes that already carry the suffix.
// Usage: node scripts/add-extend-suffix.mjs

import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3d'

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  })

const RENAMES = [
  { file: 'public/objects/washermodules/ModuleWasherSingle.glb', nodes: ['WMSingleFront'] },
  { file: 'public/objects/washermodules/ModuleWasherDouble.glb', nodes: ['WMDoubleFront1'] },
  { file: 'public/objects/washermodules/ModuleWasherPlank.glb', nodes: ['WMPlankFront1'] },
  { file: 'public/objects/washermodules/12_WMPlankLow.glb', nodes: ['WMPlankLowFront1'] },
  { file: 'public/objects/washermodules/13_WMSingleLow.glb', nodes: ['WMSingleLowFront'] },
  { file: 'public/objects/washermodules/14_WMDoubleLow.glb', nodes: ['WMDoubleLowFront1'] },
]

for (const { file, nodes } of RENAMES) {
  const doc = await io.read(file)
  let changed = false
  for (const node of doc.getRoot().listNodes()) {
    if (nodes.includes(node.getName())) {
      node.setName(`${node.getName()}_extend`)
      changed = true
      console.log(`${file}: ${node.getName()}`)
    } else if (nodes.some((n) => node.getName() === `${n}_extend`)) {
      console.log(`${file}: ${node.getName()} (already renamed)`)
    }
  }
  if (changed) await io.write(file, doc)
}
console.log('done')
