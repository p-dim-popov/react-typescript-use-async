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

type ConfigValueRetriever<
  Definitions extends Readonly<Record<string, ConfigValueDefinition<any>>>
> = {
  get: <Key extends StringKeys<Definitions>>(
    key: Definitions[Key] extends StaticConfigValueDefinition<infer T>
      ? Key
      : never
  ) => Definitions[Key] extends ConfigValueDefinition<infer T> ? T : never
  fetch: <Key extends StringKeys<Definitions>>(
    key: Key,
    controller?: AbortController
  ) => Promise<
    Definitions[Key] extends ConfigValueDefinition<infer T> ? T : never
  >
}

export const createConfigValueRetriever = <
  Definitions extends Readonly<Record<string, ConfigValueDefinition<any>>>
>(
  definitions: Definitions,
  environmentOverrides: Record<
    string,
    Partial<{ [Key in keyof Definitions & string]: Definitions[Key] }>
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

  function configGet<Key extends StringKeys<Definitions>>(
    key: Definitions[Key] extends StaticConfigValueDefinition<any> ? Key : never
  ) {
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
      ;(definition as StaticConfigValueDefinition<any>).value = value
      return value
    }

    return definition.value
  }

  return {
    get: configGet,
    fetch: configFetch,
  }
}
