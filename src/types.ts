import type { AsyncError } from './AsyncError'

export type UseAsyncResult<
  Args extends ReadonlyArray<unknown>,
  Return
> = AsyncState<Return> & {
  run: (...params: Args) => void
  abort: () => void
}

export type AsyncState<T> =
  | InitialLoadingState
  | LoadingState<T>
  | SuccessState<T>
  | ErrorState

export type InternalAsyncState<T> =
  | InitialLoadingState
  | InternalLoadingState<T>
  | SuccessState<T>
  | ErrorState

type InternalLoadingState<T> = LoadingState<T> & {
  abortController: AbortController
}

export type SuccessState<T> = {
  isLoading: false
  value: T
  error: undefined
}

export type ErrorState = {
  isLoading: false
  value: undefined
  error: AsyncError
}

export type InitialLoadingState = {
  isLoading: true
  value: undefined
  error: undefined
}

type LoadingState<T> = {
  isLoading: true
  value: T | undefined
  error: AsyncError | undefined
}

export type AsyncOptions<T> = {
  signal: AbortSignal
  prevValue: T | undefined
}
