// Temporary debugging utility — remove after fixing the crash
import * as THREE from 'three/webgpu'

let crashReported = false

export function trapNaN(value: number, label: string): number {
  if (isNaN(value) || !isFinite(value)) {
    if (!crashReported) {
      crashReported = true
      console.error(`🔴 NaN/Inf DETECTED in: ${label}`, new Error().stack)
      // eslint-disable-next-line no-alert
      alert(`NaN/Inf in: ${label}`)
    }
    return 0
  }
  return value
}

export function trapShape(shape: THREE.Shape, label: string): THREE.Shape {
  const points = shape.getPoints()
  for (let i = 0; i < points.length; i++) {
    if (isNaN(points[i].x) || isNaN(points[i].y) || !isFinite(points[i].x) || !isFinite(points[i].y)) {
      console.error(`🔴 NaN/Inf in Shape [${label}] at point ${i}:`, points[i])
      alert(`NaN/Inf in Shape: ${label} point ${i}`)
      const safe = new THREE.Shape()
      safe.moveTo(0, 0)
      safe.lineTo(0.01, 0)
      safe.lineTo(0.01, 0.01)
      safe.lineTo(0, 0.01)
      return safe
    }
  }
  // Zero-length segment check
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 1e-6) {
      console.error(`🔴 Zero-length segment in Shape [${label}] between points ${i - 1} and ${i}:`, points[i - 1], points[i])
      // eslint-disable-next-line no-alert
      alert(`ZERO-LENGTH EDGE: ${label}\npt[${i-1}]=(${points[i-1].x.toFixed(6)}, ${points[i-1].y.toFixed(6)}) → pt[${i}]=(${points[i].x.toFixed(6)}, ${points[i].y.toFixed(6)})\nAll points: ${JSON.stringify(points.map(p => [+p.x.toFixed(4), +p.y.toFixed(4)]))}`)
      // Return safe shape so ExtrudeGeometry gets valid input — don't pass the bad shape
      const safe = new THREE.Shape()
      safe.moveTo(0, 0)
      safe.lineTo(0.01, 0)
      safe.lineTo(0.01, 0.01)
      safe.lineTo(0, 0.01)
      return safe
    }
  }
  return shape
}

export function trapGeo(geo: THREE.BufferGeometry, label: string): THREE.BufferGeometry {
  const pos = geo.getAttribute('position')
  if (!pos) {
    console.error(`🔴 No position attribute [${label}]`)
    // eslint-disable-next-line no-alert
    alert(`EMPTY GEOMETRY (no position attr): ${label}`)
    return new THREE.BoxGeometry(0.01, 0.01, 0.01)
  }
  if (pos.count === 0) {
    console.error(`🔴 Empty geometry (position.count=0) [${label}]`, geo)
    // eslint-disable-next-line no-alert
    alert(`EMPTY GEOMETRY (count=0): ${label}\nExtrudeGeometry produced 0 vertices — shape is degenerate.`)
    return new THREE.BoxGeometry(0.01, 0.01, 0.01)
  }
  const arr = pos.array as Float32Array
  for (let i = 0; i < arr.length; i++) {
    if (isNaN(arr[i]) || !isFinite(arr[i])) {
      console.error(`🔴 NaN/Inf in geometry [${label}] at index ${i} (vertex ${Math.floor(i / 3)})`)
      // eslint-disable-next-line no-alert
      alert(`NaN/Inf in geometry: ${label} index ${i}`)
      return new THREE.BoxGeometry(0.01, 0.01, 0.01)
    }
  }
  return geo
}
