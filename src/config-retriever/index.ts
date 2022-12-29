import type { Notifier } from '../notifier'
import { createNotifier } from '../notifier'

type ConfigValueDefinition<T> =
  | StaticConfigValueDefinition<T>
  | DynamicConfigValueDefinition<T>
  | HybridConfigValueDefinition<T>

type StaticConfigValueDefinition<T> = {
  value: T
}

type DynamicConfigValueDefinition<T> = {
  retrieve: (
    key: string | number | symbol,
    abortController: AbortController
  ) => Promise<T>
}

type HybridConfigValueDefinition<T> = StaticConfigValueDefinition<T> &
  DynamicConfigValueDefinition<T>

type ConfigValueRetriever<D extends Definitions<Dictionary>> = {
  get: <K extends keyof D>(key: K) => ConfigGetValue<D, K>
  fetch: <K extends keyof D>(
    key: K,
    controller?: AbortController
  ) => Promise<AwaitedConfigFetchValue<D, K>>
  subscribe: Subscribe<D>
}

type Subscribe<D extends Definitions<Dictionary>> = {
  onChange: <K extends keyof D>(
    key: K,
    handler: (
      payload: ChangedValueEventPayload<ConfigDefinitionValue<D[K]>>
    ) => void
  ) => () => void
}

type Dictionary = Record<string, unknown>

type Definitions<T extends Dictionary> = {
  [K in keyof T]: ConfigValueDefinition<T[K]>
}

export const createConfigValueRetriever = <
  T extends Dictionary,
  D extends Definitions<T>
>(
  definitions: D,
  environmentOverrides: Record<string, Definitions<Partial<T>>>
): ConfigValueRetriever<D> => {
  const _environmentDefinitions: D = (() => {
    const env = 'development'
    return Object.fromEntries(
      Object.entries(definitions).map(([key, value]) => [
        key,
        { ...value, ...environmentOverrides[env][key] },
      ])
    ) as D
  })()

  const _onChangeNotifiers: ChangedValueNotifiers<D> = {}

  return {
    get: getConfigValue(_environmentDefinitions),
    fetch: fetchConfigValue(_environmentDefinitions, _onChangeNotifiers),
    subscribe: {
      onChange: subscribeOnValueChange(_onChangeNotifiers),
    },
  }
}

type ChangedValueEventPayload<T> = { oldValue: T | undefined; newValue: T }

type ChangedValueNotifiers<D extends Definitions<Dictionary>> = {
  [K in keyof D]?: Notifier<
    ChangedValueEventPayload<ConfigDefinitionValue<D[K]>>
  >
}

export const getConfigValue =
  <D extends Definitions<Dictionary>>(definitions: D) =>
  <K extends keyof D>(key: K): ConfigGetValue<D, K> => {
    const definition = definitions[key]

    if ('value' in definition) {
      return definition.value as ConfigGetValue<D, K>
    }

    return undefined as ConfigGetValue<D, K>
  }

type ConfigGetValue<
  D extends Definitions<Dictionary>,
  K extends keyof D
> = D[K] extends StaticConfigValueDefinition<infer S>
  ? S
  : D[K] extends DynamicConfigValueDefinition<infer D>
  ? D | undefined
  : never

export const fetchConfigValue =
  <D extends Definitions<Dictionary>>(
    definitions: D,
    notifiers: ChangedValueNotifiers<D>
  ) =>
  async <K extends keyof D>(
    key: K,
    abortController = new AbortController()
  ): Promise<AwaitedConfigFetchValue<D, K>> => {
    const definition = definitions[key]

    if ('retrieve' in definition) {
      const value = (await definition.retrieve(
        key,
        abortController
      )) as AwaitedConfigFetchValue<D, K>

      const oldValue = (
        'value' in definition ? definition.value : undefined
      ) as AwaitedConfigFetchValue<D, K>

      Object.assign(definition, { value })

      if (value !== oldValue) {
        notifiers[key]?.notify({ newValue: value, oldValue })
      }

      return value
    }

    return definition.value as AwaitedConfigFetchValue<D, K>
  }

type AwaitedConfigFetchValue<
  D extends Definitions<Dictionary>,
  K extends keyof D
> = ConfigDefinitionValue<D[K]>

export const subscribeOnValueChange =
  <D extends Definitions<Dictionary>>(notifiers: ChangedValueNotifiers<D>) =>
  <K extends keyof D>(
    key: K,
    handler: (
      payload: ChangedValueEventPayload<ConfigDefinitionValue<D[K]>>
    ) => void
  ) => {
    const notifier =
      notifiers[key] ??
      (notifiers[key] =
        createNotifier<ChangedValueEventPayload<ConfigDefinitionValue<D[K]>>>())
    return notifier?.subscribe(handler)
  }

type ConfigDefinitionValue<D extends ConfigValueDefinition<any>> =
  D extends ConfigValueDefinition<infer O> ? O : never
