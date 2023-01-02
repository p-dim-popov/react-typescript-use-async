export declare type UseAsyncResult<Fn extends AsyncOpDefinition> = AsyncState<
  UnwrapValue<Fn>
> & {
  fire: (...params: Parameters<Fn>) => void
  abort: () => void
}
export declare type AsyncState<T> =
  | LoadingState<T>
  | SuccessState<T>
  | ErrorState
declare type SuccessState<T> = {
  isLoading: false
  value: T
  error: undefined
}
declare type ErrorState = {
  isLoading: false
  value: undefined
  error: UseAsyncError
}
declare type LoadingState<T> = {
  isLoading: true
  value: T | undefined
  error: undefined
}
export declare class UseAsyncError extends Error {
  inner: unknown
  constructor(inner: unknown)
}
declare type AsyncOpDefinition = (...params: any[]) => (opts: Options) => any
export declare const useParameterizedAsync: <Fn extends AsyncOpDefinition>(
  fetch: Fn,
  deps: unknown[]
) => UseAsyncResult<Fn>
export declare const useImmediateAsync: <T>(
  fn: () => (opts: Options) => PromiseOrImmediate<T>,
  deps: unknown[]
) => UseAsyncResult<() => (opts: Options) => PromiseOrImmediate<T>>
declare type PromiseOrImmediate<T> = Promise<T> | T
declare type Options = {
  signal: AbortSignal
}
declare type UnwrapValue<
  Fn extends (...args: any[]) => (...args: any[]) => any
> = Awaited<ReturnType<ReturnType<Fn>>>
export {}
