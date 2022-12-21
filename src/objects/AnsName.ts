import { ChainRegistry } from './ChainRegistry'

export class AnsName {
  static chainIdIbcAsset(chainId: string, asset: string): string {
    return this.chainNameIbcAsset(ChainRegistry.chainIdToName(chainId), asset)
  }

  static chainNameIbcAsset(chainName: string, asset: string): string {
    return `${chainName.toLowerCase()}>${asset}`
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
