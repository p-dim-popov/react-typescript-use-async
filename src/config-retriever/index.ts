import type { Notifier } from '../notifier'
import { createNotifier } from '../notifier'

type ConfigValueDefinition<K extends string, T> =
  | StaticConfigValueDefinition<K, T>
  | DynamicConfigValueDefinition<K, T>
  | HybridConfigValueDefinition<K, T>

type BaseConfigValueDefinition<Key extends string> = {
  key: Key
}

type StaticConfigValueDefinition<
  K extends string,
  T
> = BaseConfigValueDefinition<K> & {
  value: T
}

type DynamicConfigValueDefinition<
  K extends string,
  T
> = BaseConfigValueDefinition<K> & {
  retrieve: (key: string, abortController: AbortController) => Promise<T>
}

type HybridConfigValueDefinition<
  K extends string,
  T
> = StaticConfigValueDefinition<K, T> & DynamicConfigValueDefinition<K, T>

type StringKeys<T> = keyof T & string

type ConfigValueRetriever<Definitions extends ExtendableOnlyDefinitions> = {
  get: <Key extends StaticOnlyKey<Definitions> & string>(
    key: Key
  ) => Definitions[Key] extends ConfigValueDefinition<Key, infer T> ? T : never
  fetch: <Key extends StringKeys<Definitions>>(
    key: Key,
    controller?: AbortController
  ) => Promise<
    Definitions[Key] extends ConfigValueDefinition<Key, infer T> ? T : never
  >
  subscribe: Subscribe<Definitions>
}

type Subscribe<Definitions extends ExtendableOnlyDefinitions> = {
  onChange: <
    Key extends string & DynamicOnlyKey<Definitions>,
    Value extends Definitions[Key] extends DynamicConfigValueDefinition<
      Key,
      infer T
    >
      ? T
      : never
  >(
    key: Key,
    handler: (payload: { newValue: Value | undefined; oldValue: Value }) => void
  ) => () => void
}

type DynamicOnlyKey<Definitions extends ExtendableOnlyDefinitions> = keyof {
  [Key in StringKeys<Definitions> as Definitions[Key] extends DynamicConfigValueDefinition<
    Key & string,
    any
  >
    ? Key
    : never]: Definitions[Key]
}

type StaticOnlyKey<Definitions extends ExtendableOnlyDefinitions> = keyof {
  [Key in StringKeys<Definitions> as Definitions[Key] extends StaticConfigValueDefinition<
    Key,
    any
  >
    ? Key
    : never]: Definitions[Key]
}

type ExtendableOnlyDefinitions = {
  [Key in string]: ConfigValueDefinition<Key, any>
}

export const createConfigValueRetriever = <
  Definitions extends ExtendableOnlyDefinitions
>(
  definitions: Definitions,
  environmentOverrides: Record<
    string,
    Partial<{ [Key in StringKeys<Definitions>]: Definitions[Key] }>
  >
): ConfigValueRetriever<Definitions> => {
  const _environmentDefinitions: Definitions = (() => {
    const env = 'development'
    return Object.fromEntries(
      Object.entries(definitions).map(([key, value]) => [
        key,
        { ...value, ...environmentOverrides[env][key] },
      ])
    ) as Definitions
  })()

  const _onChangeNotifiers: {
    [Key in keyof Definitions]?: Definitions[Key] extends DynamicConfigValueDefinition<
      string,
      infer T
    >
      ? Notifier<{ oldValue: T | undefined; newValue: T }>
      : never
  } = {}

  return {
    get: function (key: StaticOnlyKey<Definitions>) {
      const definition = _environmentDefinitions[
        key
      ] as StaticConfigValueDefinition<string, any>

      return definition.value
    },
    fetch: async function <Key extends StringKeys<Definitions>>(
      key: Key,
      abortController: AbortController = new AbortController()
    ) {
      const definition = _environmentDefinitions[key]

      if ('retrieve' in definition) {
        const value = await definition.retrieve(key, abortController)
        const oldValue = 'value' in definition ? definition.value : undefined
        Object.assign(definition, { value })

        if (value !== oldValue) {
          _onChangeNotifiers[key]?.notify({ newValue: value, oldValue })
        }

        return value
      }

      return definition.value
    },
    subscribe: {
      onChange: (key, handler) => {
        const notifier =
          _onChangeNotifiers[key] ??
          (_onChangeNotifiers[key] = createNotifier<any>())
        return () => notifier?.subscribe(handler)
      },
    },
  }
}
