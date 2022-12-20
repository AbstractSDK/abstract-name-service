import { AnsAssetEntry } from '../objects'
import { Network } from '../networks/network'
import { NetworkId } from './chains'

export class Chain {
  name: string
  networks: Network[]

  constructor(chainName: string, networks: Network[]) {
    this.name = chainName.toLowerCase()
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
}
