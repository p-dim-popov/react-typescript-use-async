import { useCallback, useState } from 'react'

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
) => (opts: { abortController: AbortController }) => Promise<T>

export const useAsync = <T, Fn extends AsyncOpDefinition<T>>(
  fetch: Fn,
  deps: unknown[]
): UseAsyncResult<T, Fn> => {
  const [state, setState] = useState<AsyncState<T>>({
    isLoading: true,
    value: undefined,
    error: undefined,
  })
  const [abortController, setAbortController] = useState<AbortController>()
  const abort = useCallback(() => abortController?.abort(), [abortController])

  const fire = useCallback((...params: Parameters<Fn>) => {
    setState((prev) => ({ ...prev, isLoading: true }))
    const abortController = new AbortController()
    setAbortController(abortController)
    ;(async () => {
      try {
        const result = await fetch(...params)({ abortController })
        setState((prev) => ({ ...prev, value: result }))
      } catch (error) {
        setState((prev) => ({ ...prev, error: error }))
      } finally {
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
