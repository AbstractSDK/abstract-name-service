import { Chain } from './chain'
import { AnsAssetEntry, AnsContractEntry, AnsPoolEntry } from '../objects'

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

  async exportContracts(): Promise<Map<ChainName, Map<NetworkId, AnsContractEntry[]>>> {
    const chainData = new Map<ChainName, Map<NetworkId, AnsContractEntry[]>>()
    await Promise.all(
      this.chains.map(async (chain) => {
        chainData.set(chain.name, await chain.exportContracts())
      })
    )

    return chainData
  }

  async exportPools(): Promise<Map<ChainName, Map<NetworkId, AnsPoolEntry[]>>> {
    const chainData = new Map<ChainName, Map<NetworkId, AnsPoolEntry[]>>()
    await Promise.all(
      this.chains.map(async (chain) => {
        chainData.set(chain.name, await chain.exportPools())
      })
    )

    return chainData
  }
}
