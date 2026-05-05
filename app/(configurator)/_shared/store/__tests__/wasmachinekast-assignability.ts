// Compile-time check: wasmachinekast WasmState must satisfy BaseConfiguratorState.
// Not a Vitest test — verified by `npm run typecheck` (tsc --noEmit).
import { useWasmachinekastStore } from '../../../wasmachinekast/store'
import type { BaseConfiguratorState } from '../types'

type WasmState = ReturnType<typeof useWasmachinekastStore['getState']>

declare const _state: WasmState
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _check: BaseConfiguratorState = _state
export {}
