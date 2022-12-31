export type Notifier<T> = {
  subscribe: Subscribe<T>
  unsubscribe: Unsubscribe<T>
  notify: (payload: T) => void
}

type Subscriber<T> = (payload: T) => void

type Subscribe<T> = (fn: Subscriber<T>) => () => void

type Unsubscribe<T> = (fn: Subscriber<T>) => void

export const createNotifier = <T>(): Notifier<T> => {
  const _listeners = new Set<Subscriber<T>>()

  const self: Notifier<T> = {
    unsubscribe: (fn) => {
      _listeners.delete(fn)
    },
    subscribe: (fn) => {
      _listeners.add(fn)
      return () => {
        self.unsubscribe(fn)
      }
    },
    notify: (payload) => _listeners.forEach((listener) => listener(payload)),
  }

  return self
}
