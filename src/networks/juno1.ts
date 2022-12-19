import { AnsAssetEntry, AssetInfo } from '../objects'
import { AnsName } from '../objects/AnsName'
import { NetworkRegistry, NetworkDefaults } from './networkRegistry'
import { Exchange } from '../exchanges/exchange'
import { Network } from './network'
import { Junoswap } from '../exchanges/junoswap'

const JUNO_1 = 'juno-1'

interface Juno1Options {
  ibcAssetsUrl: string
}

export class Juno1 extends Network {
  options: Juno1Options
  private fetchedIbcAssetsCache: JunoswapIbcAsset[]

  constructor(registry: NetworkRegistry, options: Juno1Options & NetworkDefaults) {
    super(JUNO_1, registry)
    this.options = options
    this.fetchedIbcAssetsCache = []
  }

  async registerIbcAssets(): Promise<void> {
    const ibcAssets = await this.fetchIbcAssets()
    ibcAssets.forEach((asset) => {
      const assetInfo = AssetInfo.native(asset.chain_id, asset.juno_denom)
      this.registry.registerAsset(new AnsAssetEntry(asset.symbol, assetInfo))
    }
  }

  private async fetchIbcAssets(): Promise<JunoswapIbcAsset[]> {
    if (this.fetchedIbcAssetsCache) {
      return this.fetchedIbcAssetsCache
    }

    const { ibcAssetsUrl } = this.options
    if (!ibcAssetsUrl) return []

    const ibcAssets: JunoswapIbcAssets = await fetch(ibcAssetsUrl).then((res) => res.json())
    this.fetchedIbcAssetsCache = ibcAssets.tokens

    return ibcAssets.tokens
  }

  async registerNativeAsset(unresolved: { denom: string; symbol: string }): Promise<AnsAssetEntry> {
    const { denom, symbol } = unresolved

    const assetInfo = AssetInfo.native(denom)

    const registered = this.registry.getRegisteredAsset(symbol)
    if (registered) {
      if (registered.toString() !== assetInfo.toString()) {
        throw new Error(`Asset ${symbol} already registered with different info`)
      }
      // otherwise, just return happy path
      return new AnsAssetEntry(symbol, registered)
    }

    // If its not IBC, register it!
    if (!AssetInfo.isIbcDenom(denom)) {
      return this.registry.registerAsset(new AnsAssetEntry(symbol, assetInfo))
    }

    const knownIbcAssets = await this.fetchIbcAssets()

    const matchingIbcAsset = knownIbcAssets.find((a) => a.juno_denom === denom)
    if (!matchingIbcAsset) {
      throw new Error(`No IBC asset found for denom ${denom}`)
    }

    const ibcAssetName = AnsName.ibcAsset(matchingIbcAsset.chain_id, matchingIbcAsset.symbol)
    return this.registry.registerAsset(new AnsAssetEntry(ibcAssetName, assetInfo))
  }
}

interface JunoswapIbcAssets {
  tokens: JunoswapIbcAsset[]
}

interface JunoswapIbcAsset {
  id: string
  name: string
  symbol: string
  chain_id: string
  rpc: string
  denom: string
  decimals: number
  channel: string
  juno_channel: string
  juno_denom: string
  logoURI: string
  external_deposit_uri?: string
}

/*

new Uni5()
new Junoswap(uni5)


new Junoswap()
new Uni5(junoswap)
new Juno(uni5)
 */
