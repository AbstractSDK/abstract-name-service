import { ChainRegistry } from './ChainRegistry'

export abstract class AnsName {
  static chainIdIbcAsset(chainId: string, asset: string): string {
    return this.chainNameIbcAsset(ChainRegistry.chainIdToName(chainId), asset)
  }

  static chainNameIbcAsset(chainName: string, asset: string): string {
    return `${chainName.toLowerCase().replace('testnet', '')}>${asset}`
  }

  /* `staking/${providerName}/${this.joinAssetNames(assetNames)}`  */
  static stakingContract(providerName: string, assetNames: string[]) {
    return ['staking', providerName, this.joinAssetNames(assetNames)].join('/')
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
