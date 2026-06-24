// Plain-number geometry carrier shared between the pure spec builders and the
// THREE-aware render shell. Keeping coordinates as plain numbers (not
// THREE.Vector3) is what lets the builders be unit-tested without a canvas.

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface MeasurementSpec {
  id: string
  p1: Vec3
  p2: Vec3
  /** Direction the line is pushed away from the cabinet (need not be unit). */
  offsetDir: Vec3
  /** Distance (metres) to push along offsetDir. */
  offsetDist: number
  /** Centimetre value rendered in the label. */
  label: string | number
}

export const vec3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z })
