import { createConfigValueRetriever } from './index'

const Config = createConfigValueRetriever(
  {
    KEY_1: {
      value: 123,
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

const xxx = Config.get('KEY_2')
console.log(xxx)
