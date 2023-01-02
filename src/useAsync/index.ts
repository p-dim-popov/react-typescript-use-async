import { useCallback, useRef, useState } from 'react'
import type {
  AsyncOperation,
  AsyncState,
  UnwrapAsyncResult,
  UseAsyncResult,
} from '../types'
import { AsyncError } from '../AsyncError'

export const useAsync = <Fn extends AsyncOperation>(
  fetch: Fn,
  deps?: unknown[]
): UseAsyncResult<Fn> => {
  const [state, setState] = useState<AsyncState<UnwrapAsyncResult<Fn>>>({
    isLoading: true,
    value: undefined,
    error: undefined,
  })
  const abortController = useRef<AbortController | null>(null)
  const abort = useCallback(() => abortController.current?.abort(), [])

  const run = useCallback((...params: Parameters<Fn>) => {
    setState((prev) => ({ ...prev, isLoading: true }))
    const _abortController = new AbortController()
    abortController.current = _abortController
    const execute = async () => {
      try {
        const result = await fetch(...params)({
          signal: _abortController.signal,
        })
        setState({ isLoading: false, value: result, error: undefined })
      } catch (error) {
        setState({
          isLoading: false,
          value: undefined,
          error: new AsyncError(error),
        })
      } finally {
        abortController.current = null
      }
    }
    execute()
  }, deps ?? [fetch])

  return {
    ...state,
    run,
    abort,
  }
}
