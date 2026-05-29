import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { draco, prune, dedup } from '@gltf-transform/functions';
import draco3d from 'draco3d';

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  });

const DIR = new URL('.', import.meta.url).pathname;

const KEEP = 'WMDoubleMachine';

const doc = await io.read(`${DIR}ModuleWasherDouble.glb`);
const root = doc.getRoot();
const scene = root.listScenes()[0];

// Detach all non-matching root-level nodes from scene, then prune
for (const node of scene.listChildren()) {
  if (node.getName() !== KEEP) {
    scene.removeChild(node);
    node.dispose();
  }
}

await doc.transform(prune(), dedup(), draco());
await io.write(`${DIR}WMWasherOnlyLow.glb`, doc);

const r = doc.getRoot();
console.log('Kept nodes:', r.listNodes().map(n => n.getName()));
console.log('Kept meshes:', r.listMeshes().map(m => m.getName()));
console.log('Saved WMWasherOnlyLow.glb');
