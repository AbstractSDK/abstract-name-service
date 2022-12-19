import { ChainRegistry } from './ChainRegistry'

export class AnsName {
  static ibcAsset(chainId: string, asset: string): string {
    const sourceChain = ChainRegistry.chainIdToName(chainId)
    return `${sourceChain}>${asset}`
  }

  static stakingContract(assetNames: string[]) {
    return `staking/${this.joinAssetNames(assetNames)}`
  }

  static lpToken(dexName: string, assetNames: string[]): string {
    return `${dexName.toLowerCase()}/${this.joinAssetNames(assetNames)}`
  }

  // asset names sorted by name and lowercased
  static joinAssetNames(assetNames: string[]) {
    return assetNames
      .map((s) => s.toLowerCase())
      .sort()
      .join(',')
  }
}
