import { useCallback, useReducer } from 'react'
import type { AsyncState, InitialLoadingState, UseAsyncResult } from '../types'
import { AsyncError } from '../AsyncError'
import type { InternalAsyncState } from '../types'
import type { AsyncOptions } from '../types'

export const useAsync = <Args extends ReadonlyArray<unknown>, Return>(
  fetch: (...params: Args) => (opts: AsyncOptions<Return>) => Return,
  deps?: unknown[]
): UseAsyncResult<Args, Return> => {
  const [state, dispatch] = useReducer(
    (
      prevState: InternalAsyncState<Return>,
      action:
        | { type: 'RUN'; payload: Args }
        | { type: 'ABORT' }
        | { type: 'SUCCESS'; payload: Return }
        | { type: 'FAIL'; payload: unknown }
    ): InternalAsyncState<Return> => {
      switch (action.type) {
        case 'RUN': {
          const abortController = new AbortController()
          const execute = async () => {
            try {
              const result = await fetch(...action.payload)({
                signal: abortController.signal,
                prevValue: prevState.value,
              })
              dispatch({ type: 'SUCCESS', payload: result })
            } catch (error) {
              dispatch({ type: 'FAIL', payload: error })
            }
          }
          execute()
          return {
            ...prevState,
            isLoading: true,
            abortController,
          }
        }
        case 'SUCCESS':
          return {
            value: action.payload,
            isLoading: false,
            error: undefined,
          }
        case 'FAIL':
          return {
            value: undefined,
            isLoading: false,
            error: new AsyncError(action.payload),
          }
        case 'ABORT':
          if ('abortController' in prevState) {
            prevState.abortController.abort()
          }
          return prevState
        default:
          return prevState
      }
    },
    initialState
  )
  const abort = useCallback(() => dispatch({ type: 'ABORT' }), [])

  const run = useCallback(
    (...params: Args) => dispatch({ type: 'RUN', payload: params }),
    deps ?? [fetch]
  )

  return {
    ...(state as AsyncState<Return>),
    run,
    abort,
  }
}

const initialState: InitialLoadingState = {
  isLoading: true,
  value: undefined,
  error: undefined,
}
