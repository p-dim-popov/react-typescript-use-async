import {
  createConfigValueRetriever,
  fetchConfigValue,
  getConfigValue,
  subscribeOnValueChange,
} from './index'
import { describe, expect, it, vi } from 'vitest'
import * as NotifierModule from '../notifier'

const fiddle = () => {
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

  const xxx = Config.get('KEY_2')

  console.log(xxx)
}

describe(getConfigValue.name, () => {
  it('should return static config value', function () {
    const get = getConfigValue({ key1: { value: 'test-value' } })

    expect(get('key1')).toEqual('test-value')
  })

  it('should return undefined for dynamic config value', function () {
    const get = getConfigValue({ key1: { retrieve: async () => 'test-value' } })

    expect(get('key1')).toBeUndefined()
  })

  it('should return value for hybrid config value', function () {
    const get = getConfigValue({
      key1: { retrieve: async () => 'dynamic-value', value: 'static-value' },
    })

    expect(get('key1')).toEqual('static-value')
  })
})

describe(fetchConfigValue.name, function () {
  it('should return value from retriever', async function () {
    const fetch = fetchConfigValue(
      {
        key1: { retrieve: async () => 'test-value' },
      },
      {}
    )

    expect(await fetch('key1')).toEqual('test-value')
  })

  it('should return return value for static configs', async function () {
    const fetch = fetchConfigValue(
      {
        key1: { value: 'test-value' },
      },
      {}
    )

    expect(await fetch('key1')).toEqual('test-value')
  })

  it('should update static value after retrieving dynamic', async function () {
    const definitions = {
      key1: { value: 'static-value', retrieve: async () => 'dynamic-value' },
    }

    const fetch = fetchConfigValue(definitions, {})

    await fetch('key1')

    expect(definitions.key1.value).toEqual('dynamic-value')
  })

  it.each<[any, any]>([
    [
      { value: 'static-value', retrieve: async () => 'dynamic-value' },
      { newValue: 'dynamic-value', oldValue: 'static-value' },
    ],
    [
      { retrieve: async () => 'dynamic-value' },
      { newValue: 'dynamic-value', oldValue: undefined },
    ],
  ])(
    'should notify on updating dynamic value, %j, %j',
    async function (definition, expectedPayload) {
      const fetch = fetchConfigValue(
        { key1: definition },
        {
          key1: notifierMock,
        }
      )

      await fetch('key1')

      expect(notifierMock.notify).toBeCalledWith(expectedPayload)
    }
  )
})

describe(subscribeOnValueChange.name, function () {
  it('should create notifier if not existing', function () {
    vi.spyOn(NotifierModule, 'createNotifier').mockReturnValue(notifierMock)

    const notifiers = {}
    subscribeOnValueChange(notifiers)('key1', vi.fn())

    expect(notifiers).toHaveProperty('key1', notifierMock)
  })

  it('should add handler to notifier', function () {
    const notifiers = { key1: notifierMock }
    const handlerMock = vi.fn()
    subscribeOnValueChange(notifiers)('key1', handlerMock)

    expect(notifierMock.subscribe).toBeCalledWith(handlerMock)
  })

  it('should remove handler from notifier', function () {
    const notifiers = {
      key1: {
        ...notifierMock,
        subscribe: vi.fn().mockReturnValue(notifierMock.unsubscribe),
      },
    }
    const handlerMock = vi.fn()
    const unsubscribe = subscribeOnValueChange(notifiers)('key1', handlerMock)

    expect(unsubscribe).toEqual(notifierMock.unsubscribe)
  })
})

const notifierMock = {
  notify: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}
