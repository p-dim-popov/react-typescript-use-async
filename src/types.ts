import type { UseAsyncError } from './use-async'

export type UseAsyncResult<Fn extends AsyncOperation> = AsyncState<
  UnwrapAsyncResult<Fn>
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

export type AsyncOperation = (...params: any[]) => (opts: AsyncOptions) => any

export type PromiseOrImmediate<T> = Promise<T> | T

export type AsyncOptions = { signal: AbortSignal }

export type UnwrapAsyncResult<
  Fn extends (...args: any[]) => (...args: any[]) => any
> = Awaited<ReturnType<ReturnType<Fn>>>
