import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { draco } from '@gltf-transform/functions';
import draco3d from 'draco3d';

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  });

const DIR = new URL('.', import.meta.url).pathname;

// ── ModuleWasherPlank.glb — rebuild from uncompressed source ─────────────────
{
  const doc = await io.read(`${DIR}11_WMPlank.glb`);
  const root = doc.getRoot();

  // Rename WMPlankMachineBack node → WMPlankMachine
  const machineNode = root.listNodes().find(n => n.getName() === 'WMPlankMachineBack');
  if (machineNode) {
    machineNode.setName('WMPlankMachine');
    console.log('Renamed node: WMPlankMachineBack → WMPlankMachine');
  }

  // Split multi-primitive meshes into separate named meshes + nodes
  const splits = [
    { nodeName: 'WMPlankFixedLeft',  meshName: 'Mesh.929', outNames: ['WMPlankFixedLeft1',  'WMPlankFixedLeft2']  },
    { nodeName: 'WMPlankFixedRight', meshName: 'Mesh.928', outNames: ['WMPlankFixedRight1', 'WMPlankFixedRight2'] },
  ];

  for (const { nodeName, meshName, outNames } of splits) {
    const origNode = root.listNodes().find(n => n.getName() === nodeName);
    const origMesh = root.listMeshes().find(m => m.getName() === meshName);
    if (!origNode || !origMesh) {
      console.warn(`Not found: ${nodeName} / ${meshName}`);
      continue;
    }

    const primitives = origMesh.listPrimitives();
    const scene = root.listScenes()[0];

    for (let i = 0; i < primitives.length; i++) {
      const name = outNames[i] ?? `${outNames[0]}_extra${i}`;
      const newMesh = doc.createMesh(name).addPrimitive(primitives[i]);
      const newNode = doc.createNode(name).setMesh(newMesh);
      // Copy transform from original node
      newNode.setTranslation(origNode.getTranslation());
      newNode.setRotation(origNode.getRotation());
      newNode.setScale(origNode.getScale());
      scene.addChild(newNode);
      console.log(`Created: node+mesh "${name}"`);
    }

    origNode.dispose();
    origMesh.dispose();
  }

  await doc.transform(draco());
  await io.write(`${DIR}ModuleWasherPlank.glb`, doc);
  console.log('Saved ModuleWasherPlank.glb');
}
