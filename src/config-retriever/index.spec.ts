import { createConfigValueRetriever } from './index'

const Config = createConfigValueRetriever(
  {
    KEY_1: {
      value: [''],
    },
    KEY_2: {
      retrieve: async () => 'asdfd',
      value: 123,
    },
    KEY_3: {
      retrieve: async () => 'asdfd',
    },
  },
  {
    dev: {},
  }
)

const xxx = Config.get('KEY_1')
Config.subscribe('KEY_1', 'value.change', (payload) => payload)
console.log(xxx)
