import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { projectBoxToScreen, computeFirstModuleBox } from '../MeshScreenTracker'

function makeCamera(position: [number, number, number] = [0, 0, 5]) {
  const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  cam.position.set(...position)
  cam.lookAt(0, 0, 0)
  cam.updateMatrixWorld(true)
  return cam
}

describe('projectBoxToScreen', () => {
  it('projects an origin-centered box to the viewport center', () => {
    const cam = makeCamera()
    const box = new THREE.Box3(
      new THREE.Vector3(-0.5, -0.5, -0.5),
      new THREE.Vector3(0.5, 0.5, 0.5),
    )
    const size = { width: 1000, height: 1000 }
    const r = projectBoxToScreen(box, cam, size)
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    expect(cx).toBeCloseTo(500, 0)
    expect(cy).toBeCloseTo(500, 0)
    expect(r.width).toBeGreaterThan(0)
    expect(r.height).toBeGreaterThan(0)
  })

  it('produces a rect outside the viewport for a far-off-screen box', () => {
    const cam = makeCamera()
    const box = new THREE.Box3(
      new THREE.Vector3(20, -0.5, -0.5),
      new THREE.Vector3(21, 0.5, 0.5),
    )
    const size = { width: 1000, height: 1000 }
    const r = projectBoxToScreen(box, cam, size)
    expect(r.left).toBeGreaterThan(size.width)
  })

  it('moves the projected rect when the camera shifts horizontally', () => {
    const camA = makeCamera([0, 0, 5])
    const camB = makeCamera([2, 0, 5])
    const box = new THREE.Box3(
      new THREE.Vector3(-0.5, -0.5, -0.5),
      new THREE.Vector3(0.5, 0.5, 0.5),
    )
    const size = { width: 1000, height: 1000 }
    const rA = projectBoxToScreen(box, camA, size)
    const rB = projectBoxToScreen(box, camB, size)
    expect(Math.abs(rA.left - rB.left)).toBeGreaterThan(10)
  })
})

describe('computeFirstModuleBox', () => {
  it('returns a box inside the closet footprint at slot 0', () => {
    const box = computeFirstModuleBox({
      widthCm: 240,
      heightCm: 240,
      depthCm: 60,
      moduleCount: 3,
      firstSlotIndex: 0,
    })
    expect(box.min.x).toBeLessThan(0)
    expect(box.max.x).toBeLessThan(0)
    expect(box.min.y).toBeGreaterThan(0)
    expect(box.max.y).toBeLessThan(2.4)
    expect(box.max.z).toBeLessThan(0.6)
  })

  it('shifts the box rightward as firstSlotIndex grows', () => {
    const a = computeFirstModuleBox({
      widthCm: 240,
      heightCm: 240,
      depthCm: 60,
      moduleCount: 3,
      firstSlotIndex: 0,
    })
    const b = computeFirstModuleBox({
      widthCm: 240,
      heightCm: 240,
      depthCm: 60,
      moduleCount: 3,
      firstSlotIndex: 2,
    })
    expect(b.min.x).toBeGreaterThan(a.min.x)
  })
})
