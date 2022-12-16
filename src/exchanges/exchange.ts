import { AnsAssetEntry, AnsContractEntry, AnsPoolEntry } from '../objects'

export abstract class Exchange {
  name: string
  /** The chain the exchange is on. */
  chain: Chain
  /** The supported networks for the chain that the exchange is on. */
  // readonly networks: readonly string[]

  protected constructor(name: string, chain: Chain) {
    this.name = name
    this.chain = chain
  }

  abstract supportsNetwork(network: string): boolean

  abstract retrievePools(network: string): Promise<AnsPoolEntry[]>
  abstract retrieveAssets(network: string): Promise<AnsAssetEntry[]>
  retrieveContracts(_network: string): Promise<AnsContractEntry[]> {
    return Promise.resolve([])
  }
}
