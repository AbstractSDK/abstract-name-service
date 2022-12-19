import { NetworkRegistry } from '../networks/networkRegistry'
import { AnsAssetEntry } from '../objects'
import { Network } from '../networks/network'

export class Chain {
  name: string
  networks: Network[]

  constructor(chainName: string, networks: Network[]) {
    this.name = chainName.toLowerCase()
    this.networks = networks
  }
  //
  // exportAnsAssets(): Record<string, AnsAssetEntry> {
  //
  // }
}
