import { AnsAssetEntry, AnsContractEntry, AnsPoolEntry } from '../objects'
import { AnsName } from '../objects/AnsName'
import { NetworkDefaults, NetworkRegistry } from '../networks/networkRegistry'
import { Network } from '../networks/network'

export abstract class Exchange {
  dexName: string
  /** The supported networks for the chain that the exchange is on. */

  protected constructor(dexName: string) {
    this.dexName = dexName
  }

  // abstract supportsNetwork(network: string): boolean

  abstract retrievePools(): Promise<AnsPoolEntry[]>
  abstract retrieveAssets(network: NetworkRegistry): Promise<AnsAssetEntry[]>

  /** Retrieve the staking contracts for the given network. */
  retrieveContracts(): Promise<AnsContractEntry[]> {
    return Promise.resolve([])
  }

  lpTokenName(assets: string[]): string {
    return AnsName.lpToken(this.dexName, assets)
  }
}
