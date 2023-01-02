import { describe, expect, it, vi } from 'vitest'
import { useImmediateAsync } from './index'
import { act, renderHook } from '@testing-library/react'

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
