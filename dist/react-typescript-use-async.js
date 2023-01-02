import {
  useState as d,
  useRef as f,
  useCallback as l,
  useEffect as g,
} from 'react'
class v extends Error {
  constructor(e) {
    super(
      typeof e == 'object' &&
        e !== null &&
        'message' in e &&
        typeof e.message == 'string'
        ? e.message
        : void 0
    ),
      (this.inner = e)
  }
}
const b = (s, e) => {
    const [a, r] = d({
        isLoading: !0,
        value: void 0,
        error: void 0,
      }),
      t = f(null),
      u = l(() => {
        var n
        return (n = t.current) == null ? void 0 : n.abort()
      }, []),
      i = l((...n) => {
        r((o) => ({
          ...o,
          isLoading: !0,
          error: void 0,
        }))
        const c = new AbortController()
        ;(t.current = c),
          (async () => {
            try {
              const o = await s(...n)({
                signal: c.signal,
              })
              r({ isLoading: !1, value: o, error: void 0 })
            } catch (o) {
              r({
                isLoading: !1,
                value: void 0,
                error: new v(o),
              })
            } finally {
              t.current = null
            }
          })()
      }, e)
    return {
      ...a,
      fire: i,
      abort: u,
    }
  },
  p = (s, e) => {
    const a = b(s, e),
      { fire: r, abort: t } = a
    return g(() => (r(), t), [t, r]), a
  }
export {
  v as UseAsyncError,
  p as useImmediateAsync,
  b as useParameterizedAsync,
}
