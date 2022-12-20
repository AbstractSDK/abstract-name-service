import { AnsAssetEntry, AnsContractEntry, AnsPoolEntry } from '../objects'
import { AnsName } from '../objects/AnsName'
import { Network } from '../networks/network'

export abstract class Exchange {
  dexName: string
  /** The supported networks for the chain that the exchange is on. */

  protected constructor(dexName: string) {
    this.dexName = dexName
  }

  // abstract supportsNetwork(network: string): boolean

  abstract registerPools(network: Network): void
  abstract registerAssets(network: Network): Promise<AnsAssetEntry[]>

  /** Retrieve the staking contracts for the given network. */
  registerContracts(network: Network): Promise<AnsContractEntry[]> {
    return Promise.resolve([])
  }

  lpTokenName(assets: string[]): string {
    return AnsName.lpToken(this.dexName, assets)
  }
}
