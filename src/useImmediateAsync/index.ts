import type { AsyncOptions, PromiseOrImmediate } from '../types'
import { useEffect } from 'react'
import { useAsync } from '../useAsync'

export const useImmediateAsync = <T>(
  fn: () => (opts: AsyncOptions) => PromiseOrImmediate<T>,
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
