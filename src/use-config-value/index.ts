import type { ConfigValueRetriever, Definitions } from '../config-retriever'
import type { AsyncState } from '../use-async'
import { useImmediateAsync } from '../use-async'
import type { UnwrapDefinitionValue } from '../config-retriever'

export const useConfigValue = <
  D extends Definitions<Record<string, unknown>>,
  K extends keyof D
>(
  config: ConfigValueRetriever<D>,
  key: K
): AsyncState<UnwrapDefinitionValue<D[K]>> =>
  useImmediateAsync(
    () =>
      ({ signal }) =>
        config.fetch(key, {
          signal,
          abort: () => {
            /** TODO: expect only signal */
          },
        }),
    [config, key]
  )
