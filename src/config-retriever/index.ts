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
  retrieve: (key: string | number | symbol, opts: RetrieveOptions) => Promise<T>
}

type HybridConfigValueDefinition<T> = StaticConfigValueDefinition<T> &
  DynamicConfigValueDefinition<T>

export type ConfigValueRetriever<D extends Definitions<Dictionary>> = {
  get: <K extends keyof D>(key: K) => ConfigGetValue<D, K>
  fetch: <K extends keyof D>(
    key: K,
    opts?: Partial<RetrieveOptions>
  ) => Promise<AwaitedConfigFetchValue<D, K>>
  subscribe: Subscribe<D>
}

type Subscribe<D extends Definitions<Dictionary>> = {
  onChange: <K extends keyof D>(
    key: K,
    handler: (
      payload: ChangedValueEventPayload<UnwrapDefinitionValue<D[K]>>
    ) => void
  ) => () => void
}

type Dictionary = Record<string, unknown>

export type Definitions<T extends Dictionary> = {
  [K in keyof T]: ConfigValueDefinition<T[K]>
}

export const createConfigValueRetriever = <
  T extends Dictionary,
  D extends Definitions<T>
>(
  definitions: D,
  environmentOverrides?: Partial<Record<string, Definitions<Partial<T>>>>
): ConfigValueRetriever<D> => {
  const _definitions = overrideDefinitionsFromEnvironment(
    definitions,
    environmentOverrides
  )

  const _onChangeNotifiers: ChangedValueNotifiers<D> = {}

  return {
    get: getConfigValue(_definitions),
    fetch: fetchConfigValue(_definitions, _onChangeNotifiers),
    subscribe: {
      onChange: subscribeOnValueChange(_onChangeNotifiers),
    },
  }
}

export const overrideDefinitionsFromEnvironment = <
  D extends Definitions<T>,
  T extends Dictionary
>(
  definitions: D,
  environmentOverrides:
    | Partial<Record<string, Definitions<Partial<T>>>>
    | undefined
): D => {
  const env = process.env.NODE_ENV ?? 'production'
  return Object.fromEntries(
    Object.entries(definitions).map(([key, value]) => [
      key,
      { ...value, ...environmentOverrides?.[env]?.[key] },
    ])
  ) as D
}

type ChangedValueEventPayload<T> = { oldValue: T | undefined; newValue: T }

type ChangedValueNotifiers<D extends Definitions<Dictionary>> = {
  [K in keyof D]?: Notifier<
    ChangedValueEventPayload<UnwrapDefinitionValue<D[K]>>
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
    opts?: Partial<RetrieveOptions>
  ): Promise<AwaitedConfigFetchValue<D, K>> => {
    const definition = definitions[key]

    if ('retrieve' in definition) {
      const abortController = new AbortController()
      const signal = opts?.signal ?? abortController.signal
      const retrieveOptions: RetrieveOptions = { signal }
      const value = (await definition.retrieve(
        key,
        retrieveOptions
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
> = UnwrapDefinitionValue<D[K]>

export const subscribeOnValueChange =
  <D extends Definitions<Dictionary>>(notifiers: ChangedValueNotifiers<D>) =>
  <K extends keyof D>(
    key: K,
    handler: (
      payload: ChangedValueEventPayload<UnwrapDefinitionValue<D[K]>>
    ) => void
  ) => {
    const notifier =
      notifiers[key] ??
      (notifiers[key] =
        createNotifier<ChangedValueEventPayload<UnwrapDefinitionValue<D[K]>>>())
    return notifier?.subscribe(handler)
  }

export type UnwrapDefinitionValue<D extends ConfigValueDefinition<any>> =
  D extends ConfigValueDefinition<infer O> ? O : never

type RetrieveOptions = {
  signal: AbortSignal
}
