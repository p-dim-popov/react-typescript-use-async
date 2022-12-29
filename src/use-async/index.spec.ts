import { describe, expect, it, vi } from 'vitest'
import { useAsync } from './index'
import { act, renderHook, waitFor } from '@testing-library/react'

describe(useAsync.name, () => {
  it('should render in a loading state { isLoading: true, value: undefined, error: undefined }', () => {
    const { result } = renderHook(() => useAsync(() => async () => {}, []))

    expect(result.current.isLoading).toEqual(true)
    expect(result.current.value).toBeUndefined()
    expect(result.current.error).toBeUndefined()
  })

  it('should transition to a settled state after promise resolve', async () => {
    const { result } = renderHook(() =>
      useAsync(() => async () => 'got-me', [])
    )

    result.current.fire()

    await waitFor(() => expect(result.current.isLoading).toEqual(false))
    expect(result.current.value).toEqual('got-me')
    expect(result.current.error).toEqual(undefined)
  })

  it('should transition to a error state after promise rejection', async () => {
    const errorMock = new Error('got-me')
    const { result } = renderHook(() =>
      useAsync(
        () => async () => {
          throw errorMock
        },
        []
      )
    )

    result.current.fire()

    await waitFor(() => expect(result.current.isLoading).toEqual(false))
    expect(result.current.error).toEqual(errorMock)
    expect(result.current.value).toEqual(undefined)
  })

  it('should pass parameters from fire', async () => {
    const { result } = renderHook(() =>
      useAsync((param: number) => async () => param + 1, [])
    )

    result.current.fire(2)

    await waitFor(() => expect(result.current.value).toEqual(3))
  })

  it('should signal on abort', async function () {
    const abortError = new Error('aborted')
    const { result } = renderHook(() =>
      useAsync(
        () =>
          ({ abortController }) =>
            new Promise((resolve, reject) => {
              abortController.signal.addEventListener('abort', () => {
                reject(abortError)
              })
            }),
        []
      )
    )

    await act(() => result.current.fire())

    result.current.abort()

    await waitFor(() => expect(result.current.error).toEqual(abortError))
  })

  it('should not signal abort after resolve', async function () {
    const abortSpy = vi.fn()
    const { result } = renderHook(() =>
      useAsync(
        () =>
          async ({ abortController }) => {
            abortController.signal.addEventListener('abort', abortSpy)
            return 1
          },
        []
      )
    )

    await act(() => result.current.fire())

    await waitFor(() => expect(result.current.isLoading).toEqual(false))

    await act(() => result.current.abort())
    expect(abortSpy).not.toBeCalled()
  })
})
