import { describe, expect, it, vi } from 'vitest'
import { useAsync } from './index'
import { act, renderHook, waitFor } from '@testing-library/react'
import { AsyncError } from '../AsyncError'
import type { AsyncOptions } from '../types'

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

    result.current.run()

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

    result.current.run()

    await waitFor(() => expect(result.current.isLoading).toEqual(false))
    expect(result.current.error).toBeInstanceOf(AsyncError)
    expect(result.current.error).toHaveProperty('inner', errorMock)
    expect(result.current.value).toEqual(undefined)
  })

  it('should pass parameters from "run"', async () => {
    const { result } = renderHook(() =>
      useAsync((param: number) => async () => param + 1, [])
    )

    result.current.run(2)

    await waitFor(() => expect(result.current.value).toEqual(3))
  })

  it('should signal on abort', async function () {
    const abortError = new Error('aborted')
    const { result } = renderHook(() =>
      useAsync(
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
      useAsync(
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

  describe('no dependencies', () => {
    it('should change "run" reference if async operation changes', function () {
      const { result, rerender } = renderHook(
        (fn: () => () => void) => useAsync(fn),
        {
          initialProps: () => () => {},
        }
      )

      const run = result.current.run

      rerender(() => () => {})

      expect(run).not.toEqual(result.current.run)
    })

    it('should not change "run" reference if async operation does not change', function () {
      const action = () => () => {}
      const { result, rerender } = renderHook(() => useAsync(action))

      const run = result.current.run

      rerender()

      expect(run).toEqual(result.current.run)
    })
  })

  it('should pass previous value to the options', async function () {
    const { result } = renderHook(() =>
      useAsync(
        <T extends string | number>(param: T) =>
          (opts: AsyncOptions<T>) => {
            const result = (+param || 0) + +(opts.prevValue || 0)
            return typeof param === 'string' ? `${result}` : result
          },
        []
      )
    )

    await act(() => result.current.run(1))
    await act(() => result.current.run(2))

    expect(result.current.value).toEqual(3)
  })
})
