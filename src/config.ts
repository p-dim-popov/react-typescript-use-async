import { createConfigValueRetriever } from './utils/config-retriever'

export const Config = createConfigValueRetriever({
  API: { value: 'https://httpbin.org' },
  APP_THEME: {
    retrieve: async (key, opts) => fetchTheme(opts.signal),
  },
})

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
