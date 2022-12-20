import { Chain } from './chain'
import { AnsAssetEntry } from '../objects'

export type ChainName = string
export type NetworkId = string


export class Chains {
  chains: Chain[]

  constructor(chains: Chain[]) {
    this.chains = chains
  }

  async exportAssets(): Promise<Map<ChainName, Map<NetworkId, AnsAssetEntry[]>>> {
    const chainData = new Map<ChainName, Map<NetworkId, AnsAssetEntry[]>>()
    await Promise.all(
      this.chains.map(async (chain) => {
        chainData.set(chain.name, await chain.exportAssets())
      })
    )

    return chainData
  }
}
