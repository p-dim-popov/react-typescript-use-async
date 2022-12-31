import { createConfigValueRetriever } from './utils/config-retriever'
import { useConfigValue } from './utils/use-config-value'

export const Config = createConfigValueRetriever({
  API: { value: 'https://httpbin.org' },
  APP_THEME: {
    retrieve: async (key, opts) => fetchTheme(opts.signal),
  },
})

export const useAppConfigValue = <
  K extends Parameters<typeof Config['fetch']>[0]
>(
  key: K
) => useConfigValue(Config, key)

const fetchTheme = async (signal: AbortSignal): Promise<string> => {
  try {
    await fetch(`${Config.get('API')}/delay/5`, { signal })
    const res = await fetch(`${Config.get('API')}/uuid`, { signal })
    const body = await res.json()
    return body.uuid
  } catch (err) {
    console.log('Caught error while fetching theme', err)
    return 'light'
  }
}
