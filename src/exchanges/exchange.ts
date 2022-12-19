import { AnsAssetEntry, AnsContractEntry, AnsPoolEntry } from '../objects'
import { AnsName } from '../objects/AnsName'
import { Network } from '../chains/network'

export abstract class Exchange {
  dexName: string
  /** The chain the exchange is on. */
  chain: Network
  // chain: Network
  /** The supported networks for the chain that the exchange is on. */
  // readonly networks: readonly string[]

  protected constructor(dexName: string, network: Network) {
    this.dexName = dexName
    this.chain = network
    // this.chain = chain
  }

  // abstract supportsNetwork(network: string): boolean

  abstract retrievePools(network: string): Promise<AnsPoolEntry[]>
  abstract retrieveAssets(network: string): Promise<AnsAssetEntry[]>

  retrieveLpTokens(network: string): Promise<AnsAssetEntry[]> {
    return Promise.resolve([])
  }
  /** Retrieve the staking contracts for the given network. */
  retrieveContracts(_network: string): Promise<AnsContractEntry[]> {
    return Promise.resolve([])
  }

  lpTokenName(assets: string[]): string {
    return AnsName.lpToken(this.dexName, assets)
  }
}
