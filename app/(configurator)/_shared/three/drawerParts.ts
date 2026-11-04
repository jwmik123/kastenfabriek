/**
 * Drawer parts by mesh name, the same in every drawer GLB: the box (sides,
 * bottom, back — `…Left1_ds`, `…Bottom2_ds_ws`, `…Back`), a pull-out plank
 * (`WMPlankPlank`), finished like a box, and the runners (`…Fixed…`). Not the cabinet's own panels (`…Panel3Left_ds`) or shelves.
 * Only meaningful in a GLB that has drawers (Front* meshes): a carcass GLB
 * may name its own panels Left/Right/Back too.
 */
const DRAWER_BOX_RE = /(?:Left|Right|Bottom|Back)\d*(?:_ds|_ws)*$/

export function isDrawerBoxMesh(name: string): boolean {
  if (/Panel|Fixed|Shelf|Machine/.test(name)) return false
  return DRAWER_BOX_RE.test(name) || name.endsWith('Plank')
}

export function isDrawerRunnerMesh(name: string): boolean {
  return name.includes('Fixed')
}
