'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { useFrame, useThree } from '@react-three/fiber'

const FREEZE_THRESHOLD_MS = 2500
const CHECK_INTERVAL_MS = 500
const RECOVERY_GRACE_MS = 3000
const INITIAL_GRACE_MS = 5000
const AUTO_REMOUNT_AFTER_MS = 6000

interface MonitorProps {
  heartbeatRef: MutableRefObject<number>
  onDeviceLost: () => void
}

function CanvasHealthMonitor({ heartbeatRef, onDeviceLost }: MonitorProps) {
  const { gl } = useThree()

  useFrame(() => {
    heartbeatRef.current = performance.now()
  })

  useEffect(() => {
    const renderer = gl as unknown as {
      domElement?: HTMLCanvasElement
      backend?: { device?: GPUDevice }
      _device?: GPUDevice
    }
    let cancelled = false

    const canvas = renderer.domElement
    const onContextLost = (e: Event) => {
      e.preventDefault()
      if (!cancelled) onDeviceLost()
    }
    canvas?.addEventListener('webglcontextlost', onContextLost)

    const device = renderer.backend?.device ?? renderer._device
    if (device?.lost) {
      device.lost
        .then((info) => {
          if (cancelled) return
          if (info?.reason === 'destroyed') return
          console.warn('[CanvasFreezeGuard] WebGPU device lost', info)
          onDeviceLost()
        })
        .catch(() => {})
    }

    return () => {
      cancelled = true
      canvas?.removeEventListener('webglcontextlost', onContextLost)
    }
  }, [gl, onDeviceLost])

  return null
}

export interface CanvasHealthHandle {
  canvasKey: number
  monitorProps: MonitorProps
  Monitor: typeof CanvasHealthMonitor
}

interface CanvasFreezeGuardProps {
  children: (handle: CanvasHealthHandle) => ReactNode
}

export default function CanvasFreezeGuard({ children }: CanvasFreezeGuardProps) {
  const [canvasKey, setCanvasKey] = useState(0)
  const [frozen, setFrozen] = useState(false)
  const heartbeatRef = useRef(performance.now())
  const mountTsRef = useRef(performance.now())
  const recoveringUntilRef = useRef(0)
  const frozenSinceRef = useRef<number | null>(null)

  const remount = useCallback(() => {
    const now = performance.now()
    recoveringUntilRef.current = now + RECOVERY_GRACE_MS
    heartbeatRef.current = now
    mountTsRef.current = now
    frozenSinceRef.current = null
    setFrozen(false)
    setCanvasKey((k) => k + 1)
  }, [])

  const onDeviceLost = useCallback(() => {
    frozenSinceRef.current = performance.now()
    setFrozen(true)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const now = performance.now()
      if (now < recoveringUntilRef.current) return
      if (now - mountTsRef.current < INITIAL_GRACE_MS) return

      const gap = now - heartbeatRef.current
      if (gap > FREEZE_THRESHOLD_MS) {
        if (frozenSinceRef.current == null) {
          frozenSinceRef.current = now
          setFrozen(true)
        } else if (now - frozenSinceRef.current > AUTO_REMOUNT_AFTER_MS) {
          remount()
        }
      } else if (frozenSinceRef.current != null) {
        frozenSinceRef.current = null
        setFrozen(false)
      }
    }, CHECK_INTERVAL_MS)
    return () => clearInterval(id)
  }, [remount])

  const handle: CanvasHealthHandle = {
    canvasKey,
    monitorProps: { heartbeatRef, onDeviceLost },
    Monitor: CanvasHealthMonitor,
  }

  return (
    <>
      {children(handle)}
      {frozen && (
        <div
          role="alertdialog"
          aria-live="assertive"
          className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
          <div className="bg-white rounded-lg p-5 shadow-xl flex flex-col gap-3 items-center max-w-sm mx-4 text-center">
            <p className="text-sm font-medium">3D-weergave reageert niet</p>
            <p className="text-xs text-gray-600">
              De scene wordt hersteld. Je instellingen blijven bewaard.
            </p>
            <button
              type="button"
              onClick={remount}
              className="px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800"
            >
              Scene herstellen
            </button>
          </div>
        </div>
      )}
    </>
  )
}
