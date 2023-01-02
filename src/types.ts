import type { UseAsyncError } from './use-async'

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

export type AsyncOpDefinition = (...params: any[]) => (opts: Options) => any

export type PromiseOrImmediate<T> = Promise<T> | T

export type Options = { signal: AbortSignal }

export type UnwrapValue<
  Fn extends (...args: any[]) => (...args: any[]) => any
> = Awaited<ReturnType<ReturnType<Fn>>>
