import {
  fetchConfigValue,
  getConfigValue,
  overrideDefinitionsFromEnvironment,
  subscribeOnValueChange,
} from './index'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as NotifierModule from '../notifier'

describe(overrideDefinitionsFromEnvironment.name, function () {
  describe.each<[string, { value: string }]>([
    ['development', { value: 'from-dev' }],
    ['production', { value: 'from-prod' }],
    ['test', { value: 'static' }],
  ])('environment: %s, expected: %j', function (env, expectedResult) {
    eachOverrideProcessEnv({ NODE_ENV: env })

    it('should override definition from correct environment', function () {
      const result = overrideDefinitionsFromEnvironment(
        {
          key1: { value: 'static' },
        },
        {
          development: {
            key1: { value: 'from-dev' },
          },
          production: {
            key1: { value: 'from-prod' },
          },
        }
      )

      expect(result.key1).toEqual(expectedResult)
    })
  })
})

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

const eachOverrideProcessEnv = (overrides: Partial<typeof process.env>) => {
  const processEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...processEnv, ...overrides }
  })

  afterEach(() => {
    process.env = { ...processEnv }
  })
}
