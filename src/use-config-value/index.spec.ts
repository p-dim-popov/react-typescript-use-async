import { describe, expect, it } from 'vitest'
import { useConfigValue } from './index'
import { renderHook, waitFor } from '@testing-library/react'
import { createConfigValueRetriever } from '../config-retriever'

describe(useConfigValue.name, function () {
  it.each([
    ['KEY_1', 'static-value'],
    ['KEY_2', 'dynamic-value'],
    ['KEY_3', 'changed-value'],
  ] as const)(
    'should return resolved config value, key %s',
    async function (
      key: Parameters<typeof ConfigMock['fetch']>[0],
      expectedValue: string
    ) {
      const { result } = renderHook(() => useConfigValue(ConfigMock, key))

      await waitFor(() => expect(result.current.value).toEqual(expectedValue))
    }
  )
})

const ConfigMock = createConfigValueRetriever({
  KEY_1: {
    value: 'static-value',
  },
  KEY_2: {
    retrieve: async () => 'dynamic-value',
  },
  KEY_3: {
    retrieve: async () => 'changed-value',
    value: 'initial-value',
  },
})
