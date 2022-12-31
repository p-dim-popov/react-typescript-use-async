import { describe, expect, it, vi } from 'vitest'
import { createNotifier } from './index'

describe('createNotifier', () => {
  it('should be able to add subscribers', () => {
    const notifier = createNotifier()

    notifier.subscribe(vi.fn())
  })

  it('should be able to unsubscribe', () => {
    const notifier = createNotifier()
    const handler = vi.fn()

    const unsubscribe = notifier.subscribe(handler)
    expect(unsubscribe).toBeInstanceOf(Function)
  })

  it('should call subscribers with payload on notify', function () {
    const notifier = createNotifier()
    const spy = vi.fn()
    notifier.subscribe(spy)

    const payload = { data: 'secret' }
    notifier.notify(payload)

    expect(spy).toBeCalledWith(payload)
  })
})
