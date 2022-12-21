import { assets, chains } from 'chain-registry'
import { AnsName } from './AnsName'

export class ChainRegistry {
  static chainIdToName(chainId: string): string {
    const chainName = chains.find((c) => c.chain_id === chainId)?.chain_name
    if (!chainName) {
      throw new Error(`chain not found for chain id ${chainId}`)
    }
    return chainName
  }

  static externalChainDenomToAnsName(searchDenom: string): string {
    let found: { chain: string; symbol: string } | undefined
    for (const list of assets) {
      const { chain_name, assets } = list
      const foundAsset = assets.find((unit) =>
        unit.denom_units.some((unit) => unit.denom === searchDenom)
      )
      if (foundAsset) {
        found = { chain: chain_name, symbol: foundAsset.symbol.toLowerCase() }
        break
      }
    }
    if (!found) {
      throw new Error(`asset not found for address ${searchDenom}`)
    }
    return AnsName.chainNameIbcAsset(found.chain, found.symbol)
  }

  static findSymbol(chainId: string, denom: string): string {
    const chainName = this.chainIdToName(chainId)
    const asset = assets
      .find((a) => a.chain_name === chainName)
      ?.assets.find((a) => a.denom_units.some((u) => u.denom === denom))
    if (!asset) {
      throw new Error(`asset not found for chain ${chainName} and denom ${denom}`)
    }
    return asset.symbol.toLowerCase()
  }
}
