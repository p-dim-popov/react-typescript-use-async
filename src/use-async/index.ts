import { useCallback, useEffect, useRef, useState } from 'react'

export type UseAsyncResult<Fn extends AsyncOpDefinition> = AsyncState<
  UnwrapValue<Fn>
> & {
  run: (...params: Parameters<Fn>) => void
  abort: () => void
}

export type AsyncState<T> = LoadingState<T> | SuccessState<T> | ErrorState

type SuccessState<T> = {
  isLoading: false
  value: T
  error: undefined
}

type ErrorState = {
  isLoading: false
  value: undefined
  error: UseAsyncError
}

type LoadingState<T> = {
  isLoading: true
  value: T | undefined
  error: UseAsyncError | undefined
}

export class UseAsyncError extends Error {
  constructor(public inner: unknown) {
    super(
      typeof inner === 'object' &&
        inner !== null &&
        'message' in inner &&
        typeof inner.message === 'string'
        ? (inner as Error).message
        : undefined
    )
  }
}

type AsyncOpDefinition = (...params: any[]) => (opts: Options) => any

export const useAsync = <Fn extends AsyncOpDefinition>(
  fetch: Fn,
  deps: unknown[]
): UseAsyncResult<Fn> => {
  const [state, setState] = useState<AsyncState<UnwrapValue<Fn>>>({
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
          error: new UseAsyncError(error),
        })
      } finally {
        abortController.current = null
      }
    }
    execute()
  }, deps)

  return {
    ...state,
    run,
    abort,
  }
}

export const useImmediateAsync = <T>(
  fn: () => (opts: Options) => PromiseOrImmediate<T>,
  deps: unknown[]
) => {
  const result = useAsync(fn, deps)

  const { run, abort } = result
  useEffect(() => {
    run()

    return abort
  }, [abort, run])

  return result
}

type PromiseOrImmediate<T> = Promise<T> | T

type Options = { signal: AbortSignal }

type UnwrapValue<Fn extends (...args: any[]) => (...args: any[]) => any> =
  Awaited<ReturnType<ReturnType<Fn>>>
