type ConfigValueDefinition<T> =
  | StaticConfigValueDefinition<T>
  | DynamicConfigValueDefinition<T>
  | HybridConfigValueDefinition<T>

type StaticConfigValueDefinition<T> = {
  value: T
}

type DynamicConfigValueDefinition<T> = {
  retrieve: (key: string, abortController: AbortController) => Promise<T>
}

type HybridConfigValueDefinition<T> = StaticConfigValueDefinition<T> &
  DynamicConfigValueDefinition<T>

type StringKeys<T> = keyof T & string

type ConfigValueRetriever<Definitions extends ExtendableOnlyDefinitions> = {
  get: <Key extends StaticOnlyKey<Definitions>>(
    key: Key
  ) => Definitions[Key] extends ConfigValueDefinition<infer T> ? T : never
  fetch: <Key extends StringKeys<Definitions>>(
    key: Key,
    controller?: AbortController
  ) => Promise<
    Definitions[Key] extends ConfigValueDefinition<infer T> ? T : never
  >
  subscribe: Subscribe<Definitions>
}

type Subscribe<Definitions extends ExtendableOnlyDefinitions> = <
  Key extends StringKeys<Definitions>,
  A extends Action<any>
>(
  key: Key,
  type: A['type'],
  handler: (payload: ReturnType<A['register']>) => void
) => () => void

type Dispatch<Definitions extends ExtendableOnlyDefinitions> = <
  Key extends StringKeys<Definitions>,
  A extends Action<Definitions>
>(
  key: Key,
  type: A['type'],
  payload: ReturnType<A['register']>
) => void

type Action<Definitions extends ExtendableOnlyDefinitions> = {
  type: 'value.change'
  register: <Key extends DynamicOnlyKey<Definitions>>(
    key: Key
  ) => Definitions[Key]
}

type DynamicOnlyKey<Definitions extends ExtendableOnlyDefinitions> = keyof {
  [Key in StringKeys<Definitions> as Definitions[Key] extends DynamicConfigValueDefinition<any>
    ? Key
    : never]: Definitions[Key]
}

type StaticOnlyKey<Definitions extends ExtendableOnlyDefinitions> = keyof {
  [Key in StringKeys<Definitions> as Definitions[Key] extends StaticConfigValueDefinition<any>
    ? Key
    : never]: Definitions[Key]
}

type ExtendableOnlyDefinitions = Readonly<
  Record<string, ConfigValueDefinition<any>>
>

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

  function configGet(key: StaticOnlyKey<Definitions>) {
    const definition = _environmentDefinitions[
      key
    ] as StaticConfigValueDefinition<any>

    return definition.value
  }

  async function configFetch<Key extends StringKeys<Definitions>>(
    key: Key,
    abortController: AbortController = new AbortController()
  ) {
    const definition = _environmentDefinitions[key]

    if ('retrieve' in definition) {
      const value = await definition.retrieve(key, abortController)
      Object.assign(definition, { value })
      _dispatch(key, 'value.change', value)
      return value
    }

    return definition.value
  }

  type Listeners = Partial<
    Record<
      keyof Definitions,
      Partial<
        Record<
          Action<Definitions>['type'],
          Set<(payload: ReturnType<Action<Definitions>['register']>) => void>
        >
      >
    >
  >
  const _listeners: Listeners = {}

  const _dispatch: Dispatch<Definitions> = (key, type, payload) =>
    _listeners[key]?.[type]?.forEach((listener) => listener(payload))

  return {
    get: configGet,
    fetch: configFetch,
    subscribe: (key, action, handler) => {
      const valueListeners = (() => _listeners[key] ?? (_listeners[key] = {}))()
      const actionListeners = (() =>
        valueListeners[action] ?? (valueListeners[action] = new Set()))()

      const _handler = handler as () => void
      actionListeners.add(_handler)
      return () => actionListeners.delete(_handler)
    },
  }
}
