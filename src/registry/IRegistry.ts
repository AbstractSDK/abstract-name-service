export abstract class IRegistry<T> {
  abstract register(entry: T): void

  abstract unknown(entry: T): void

  abstract export(): T[]
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class AlreadyRegisteredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AlreadyRegisteredError'
  }
}
