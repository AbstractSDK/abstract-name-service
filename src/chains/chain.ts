import { AnsAssetEntry, AnsContractEntry, AnsPoolEntry } from '../objects'
import { Network } from '../networks/network'

export class Chain {
  name: ChainName
  networks: Network[]

  constructor(chainName: ChainName, networks: Network[]) {
    this.name = chainName.toLowerCase() as ChainName
    this.networks = networks
  }

  async exportAssets(): Promise<Map<NetworkId, AnsAssetEntry[]>> {
    const networkToAssets = new Map<NetworkId, AnsAssetEntry[]>()
    await Promise.all(
      this.networks.map(async (network) => {
        networkToAssets.set(network.networkId, await network.exportAssets())
      })
    )

    return networkToAssets
  }

  async exportContracts(): Promise<Map<NetworkId, AnsContractEntry[]>> {
    const networkToContracts = new Map<NetworkId, AnsContractEntry[]>()
    await Promise.all(
      this.networks.map(async (network) => {
        networkToContracts.set(network.networkId, await network.exportContracts())
      })
    )

    return networkToContracts
  }

  async exportPools(): Promise<Map<NetworkId, AnsPoolEntry[]>> {
    const networkToPools = new Map<NetworkId, AnsPoolEntry[]>()
    await Promise.all(
      this.networks.map(async (network) => {
        networkToPools.set(network.networkId, await network.exportPools())
      })
    )

    return networkToPools
  }
}
