import { describe, expect, it } from 'vitest'
import { AsyncError } from './index'

describe(AsyncError.name, function () {
  it('should make an instance of an error', function () {
    const error = new AsyncError('')

    expect(error).toBeInstanceOf(Error)
  })

  it('should set passed value as an inner error', function () {
    const actualError = new TypeError()
    const error = new AsyncError(actualError)

    expect(error.inner).toBe(actualError)
  })

  it.each([
    [
      new TypeError('Cannot access "call" of undefined'),
      'Cannot access "call" of undefined',
    ],
    [{ message: 'Unknown character' }, 'Unknown character'],
    ['Record does not exist', 'Record does not exist'],
    [{ message: {} }, ''],
    [{ code: 404 }, ''],
  ])(
    'should set message from passed value as an error message: "%s", "%s"',
    function (error, expectedMessage: string | undefined) {
      const result = new AsyncError(error)

      expect(result.message).toEqual(expectedMessage)
    }
  )
})
