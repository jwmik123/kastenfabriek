import { describe, it, expect } from 'vitest'
import { isDrawerBoxMesh, isDrawerRunnerMesh } from '../three/drawerParts'

describe('drawer parts by mesh name', () => {
  it('finds the drawer box in every drawer GLB', () => {
    for (const name of [
      'DrawerLeft1_ds', 'DrawerRight3_ds', 'DrawerBottom2_ds_ws', 'DrawerBack1_ws',
      'WMSingleBack', 'WMSingleBottom1_ds', 'WMDoubleLeft2_ds', 'WMPlankRight_ds',
      'WMDoubleLowBottom2_ds', 'WMPlankLowBack',
    ]) {
      expect(isDrawerBoxMesh(name), name).toBe(true)
    }
  })

  it('leaves the cabinet panels, shelves, fronts and runners alone', () => {
    for (const name of [
      'DrawerPanel3Left_ds', 'DrawerPanel2Right', 'WMSingleShelf1_ds', 'DrawerShelf_ds_ws',
      'DrawerFront1_ws', 'WMPlankFront2', 'WMPlankFixedLeft1', 'WMPlankPlank', 'WMSingleMachine',
    ]) {
      expect(isDrawerBoxMesh(name), name).toBe(false)
    }
  })

  it('finds the runners', () => {
    expect(isDrawerRunnerMesh('DrawerFixedLeft')).toBe(true)
    expect(isDrawerRunnerMesh('WMPlankFixedRight2')).toBe(true)
    expect(isDrawerRunnerMesh('DrawerLeft1_ds')).toBe(false)
  })
})
