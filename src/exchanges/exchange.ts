import { AnsName } from '../objects/AnsName'
import { Network } from '../networks/network'
import { AnsContractEntry } from '../objects'

/**
 * Class representing an exchange.
 */
export abstract class Exchange {
  name: string

  protected constructor(dexName: string) {
    this.name = dexName
  }

  abstract registerAssets(network: Network): void

  abstract registerPools(network: Network): void

  /** Retrieve the (staking) contracts for the given network. */
  registerContracts(_network: Network): void {}

  /** Build the lp token name using this dex name. */
  lpTokenName(assets: string[]): string {
    return AnsName.lpToken(this.name, assets)
  }

  /**
   * {"protocol":"osmosis","contract":"staking/osmosis/cosmoshub>atom,osmosis>osmo"}: <staking address or id>
   * @param assetNames
   * @param stakingAddress
   */
  stakingContractEntry(assetNames: string[], stakingAddress: string): AnsContractEntry {
    const stakingContractName = AnsName.stakingContract(this.name.toLowerCase(), assetNames)

    return new AnsContractEntry(this.name.toLowerCase(), stakingContractName, stakingAddress)
  }
}
