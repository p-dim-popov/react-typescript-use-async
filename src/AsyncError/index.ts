export class AsyncError extends Error {
  constructor(public inner: unknown) {
    super(asMessage(inner))
  }
}

const asMessage = (error: unknown): string | undefined => {
  if (typeof error === 'string') {
    return error
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return (error as Error).message
  }

  return undefined
}
