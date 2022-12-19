import { NetworkRegistry, NetworkDefaults } from './networkRegistry'
import { Exchange } from '../exchanges/exchange'

interface Uni5Options {

}

export class Uni5 extends NetworkRegistry {
  private options: Uni5Options

  constructor(options: Uni5Options & NetworkDefaults) {
    super('uni-5', options)
    this.options = options
  }
}
