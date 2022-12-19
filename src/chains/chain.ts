import { Network } from './network'

export class Chain {
  networks: Network[]

  constructor(networks: Network[]) {
    this.networks = networks
  }
}
