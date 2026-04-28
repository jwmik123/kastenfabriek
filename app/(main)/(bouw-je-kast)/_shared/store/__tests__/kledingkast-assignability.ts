// Compile-time check: kledingkast ClosetState must satisfy BaseConfiguratorState & DiagonalSlice.
// Not a Vitest test — verified by `npm run typecheck` (tsc --noEmit).
import { useClosetStore } from '../../../kledingkast/store'
import type { BaseConfiguratorState, DiagonalSlice } from '../types'

type KledingkastState = ReturnType<typeof useClosetStore['getState']>

// If this assignment fails to compile, ClosetState no longer satisfies the shared interface.
declare const _state: KledingkastState
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _check: BaseConfiguratorState & DiagonalSlice = _state
export {}
