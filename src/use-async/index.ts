import { useCallback, useEffect, useRef, useState } from 'react'

type UseAsyncResult<T, Fn extends AsyncOpDefinition<T>> = AsyncState<T> & {
  fire: (...params: Parameters<Fn>) => void
  abort: () => void
}

type AsyncState<T> =
  | { isLoading: false; value: T; error: undefined }
  | { isLoading: true; value: T | undefined; error: unknown | undefined }
  | { isLoading: false; value: T | undefined; error: unknown }

type AsyncOpDefinition<T> = (
  ...params: any[]
) => (opts: Options) => PromiseOrImmediate<T>

export const useParameterizedAsync = <T, Fn extends AsyncOpDefinition<T>>(
  fetch: Fn,
  deps: unknown[]
): UseAsyncResult<T, Fn> => {
  const [state, setState] = useState<AsyncState<T>>({
    isLoading: true,
    value: undefined,
    error: undefined,
  })
  const abortController = useRef<AbortController | null>(null)
  const abort = useCallback(() => abortController.current?.abort(), [])

  const fire = useCallback((...params: Parameters<Fn>) => {
    setState((prev) => ({ ...prev, isLoading: true }))
    const _abortController = new AbortController()
    abortController.current = _abortController
    ;(async () => {
      try {
        const result = await fetch(...params)({
          abortController: _abortController,
        })
        setState((prev) => ({ ...prev, value: result }))
      } catch (error) {
        setState((prev) => ({ ...prev, error: error }))
      } finally {
        abortController.current = null
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    })()
  }, deps)

  return {
    ...state,
    fire,
    abort,
  }
}

export const useImmediateAsync = <T>(
  fn: () => (opts: Options) => PromiseOrImmediate<T>,
  deps: unknown[]
) => {
  const result = useParameterizedAsync(fn, deps)

  const { fire, abort } = result
  useEffect(() => {
    fire()

    return abort
  }, [abort, fire])

  return result
}

type PromiseOrImmediate<T> = Promise<T> | T

type Options = { abortController: AbortController }
