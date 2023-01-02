import { describe, expect, it, vi } from 'vitest'
import {
  useParameterizedAsync,
  useImmediateAsync,
  UseAsyncError,
} from './index'
import { act, renderHook, waitFor } from '@testing-library/react'

describe(useParameterizedAsync.name, () => {
  it('should render in a loading state { isLoading: true, value: undefined, error: undefined }', () => {
    const { result } = renderHook(() =>
      useParameterizedAsync(() => async () => {}, [])
    )

    expect(result.current.isLoading).toEqual(true)
    expect(result.current.value).toBeUndefined()
    expect(result.current.error).toBeUndefined()
  })

  it('should transition to a settled state after promise resolve', async () => {
    const { result } = renderHook(() =>
      useParameterizedAsync(() => async () => 'got-me', [])
    )

    result.current.run()

    await waitFor(() => expect(result.current.isLoading).toEqual(false))
    expect(result.current.value).toEqual('got-me')
    expect(result.current.error).toEqual(undefined)
  })

  it('should transition to a error state after promise rejection', async () => {
    const errorMock = new Error('got-me')
    const { result } = renderHook(() =>
      useParameterizedAsync(
        () => async () => {
          throw errorMock
        },
        []
      )
    )

    result.current.run()

    await waitFor(() => expect(result.current.isLoading).toEqual(false))
    expect(result.current.error).toBeInstanceOf(UseAsyncError)
    expect(result.current.error).toHaveProperty('inner', errorMock)
    expect(result.current.value).toEqual(undefined)
  })

  it('should pass parameters from "run"', async () => {
    const { result } = renderHook(() =>
      useParameterizedAsync((param: number) => async () => param + 1, [])
    )

    result.current.run(2)

    await waitFor(() => expect(result.current.value).toEqual(3))
  })

  it('should signal on abort', async function () {
    const abortError = new Error('aborted')
    const { result } = renderHook(() =>
      useParameterizedAsync(
        () =>
          ({ signal }) =>
            new Promise((resolve, reject) => {
              signal.addEventListener('abort', () => {
                reject(abortError)
              })
            }),
        []
      )
    )

    await act(() => result.current.run())

    result.current.abort()

    await waitFor(() => expect(result.current.error).toEqual(abortError))
  })

  it('should not signal abort after resolve', async function () {
    const abortSpy = vi.fn()
    const { result } = renderHook(() =>
      useParameterizedAsync(
        () =>
          async ({ signal }) => {
            signal.addEventListener('abort', abortSpy)
            return 1
          },
        []
      )
    )

    await act(() => result.current.run())

    await waitFor(() => expect(result.current.isLoading).toEqual(false))

    await act(() => result.current.abort())
    expect(abortSpy).not.toBeCalled()
  })
})

describe(useImmediateAsync.name, function () {
  it('should call run the action upon mount', async function () {
    const asyncOperationMock = vi.fn()
    renderHook(() => useImmediateAsync(() => asyncOperationMock, []))

    expect(asyncOperationMock).toBeCalled()
  })

  it('should abort and run the action again on dependencies change', async function () {
    vi.useFakeTimers()
    const { earlyCallMock, lateCallMock, operationMock, rejectSpy } =
      getAbortableSpy()

    const { rerender } = renderHook((deps: unknown[] = [1]) =>
      useImmediateAsync(() => operationMock, deps)
    )

    await act(() => vi.advanceTimersByTime(5))
    rerender([2])

    expect(operationMock).toBeCalledTimes(2)
    expect(earlyCallMock).toBeCalledTimes(2)
    expect(rejectSpy).toBeCalled()
    expect(lateCallMock).not.toBeCalled()
  })

  it('should not abort on function change (re-render)', async function () {
    vi.useFakeTimers()
    const { earlyCallMock, lateCallMock, operationMock, rejectSpy } =
      getAbortableSpy()

    const { rerender } = renderHook(
      (func: Parameters<typeof useImmediateAsync>[0] = () => operationMock) =>
        useImmediateAsync(func, [])
    )

    await act(() => vi.advanceTimersByTime(5))
    rerender(() => operationMock)
    await act(() => vi.advanceTimersByTime(5))

    expect(operationMock).toBeCalledTimes(1)
    expect(earlyCallMock).toBeCalledTimes(1)
    expect(lateCallMock).toBeCalledTimes(1)
    expect(rejectSpy).not.toBeCalled()
  })

  const getAbortableSpy = () => {
    const earlyCallMock = vi.fn()
    const lateCallMock = vi.fn()
    const rejectSpy = vi.fn()
    const operationMock = vi.fn(async (opts: { signal: AbortSignal }) => {
      earlyCallMock()
      await new Promise((resolve, reject) => {
        opts.signal.addEventListener('abort', (evt) => {
          rejectSpy(evt)
          reject(evt)
        })
        setTimeout(resolve, 10)
      })
      lateCallMock()
    })

    return { earlyCallMock, lateCallMock, operationMock, rejectSpy }
  }
})
