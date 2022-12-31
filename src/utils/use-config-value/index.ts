import type { ConfigValueRetriever, Definitions } from '../config-retriever'
import type { AsyncState } from '../use-async'
import { useImmediateAsync } from '../use-async'
import type { UnwrapDefinitionValue } from '../config-retriever'
import { useEffect, useState } from 'react'

export const useConfigValue = <
  D extends Definitions<Record<string, unknown>>,
  K extends keyof D
>(
  config: ConfigValueRetriever<D>,
  key: K
): AsyncState<UnwrapDefinitionValue<D[K]>> => {
  const [value, setValue] = useState<UnwrapDefinitionValue<D[K]>>()

  const result = useImmediateAsync(
    () =>
      ({ signal }) =>
        config.fetch(key, { signal }),
    [config, key]
  )

  useEffect(
    () =>
      config.subscribe.onChange(key, (payload) => setValue(payload.newValue)),
    [config.subscribe, key]
  )

  if (typeof value === 'undefined') {
    return result
  }

  return {
    isLoading: false,
    error: undefined,
    value,
  }
}
