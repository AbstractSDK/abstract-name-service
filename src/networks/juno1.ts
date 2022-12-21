import { AnsAssetEntry, AssetInfo } from '../objects'
import { AnsName } from '../objects/AnsName'
import { Network } from './network'
import { Junoswap } from '../exchanges/junoswap'
import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'


const JUNO_1 = 'juno-1'

interface Juno1Options {
  ibcAssetsUrl: string
}

export class Juno1 extends Network {
  options: Juno1Options
  private fetchedIbcAssetsCache: JunoswapIbcAsset[] | undefined

  constructor(
    assetRegistry: AssetRegistry,
    contractRegistry: ContractRegistry,
    poolRegistry: PoolRegistry,
    options: Juno1Options
  ) {
    super({
      networkId: JUNO_1,
      assetRegistry,
      contractRegistry,
      poolRegistry,
      exchanges: [
        new Junoswap({
          poolListUrl:
            'https://raw.githubusercontent.com/CosmosContracts/junoswap-asset-list/main/pools_list.json',
        }),
      ],
    })
    this.options = options
  }

  async registerIbcAssets(): Promise<void> {
    //   const ibcAssets = await this.fetchIbcAssets()
    //   ibcAssets.forEach((asset) => {
    //     const assetInfo = AssetInfo.native(asset.chain_id, asset.juno_denom)
    //     this.registry.registerAsset(new AnsAssetEntry(asset.symbol, assetInfo))
    //   }
  }

  async registerChainNativeAsset({ denom, symbol }: { denom: string; symbol?: string }) {
    const assetInfo = AssetInfo.native(denom)

    if (!symbol) {
      symbol = this.findNativeAssetSymbol(denom)
    }

    // const registered = this.registry.getRegisteredAsset(symbol)
    // if (registered) {
    //   if (registered.toString() !== assetInfo.toString()) {
    //     throw new Error(`Asset ${symbol} already registered with different info`)
    //   }
    //   // otherwise, just return happy path
    //   return new AnsAssetEntry(symbol, registered)
    // }

    // If it's not IBC, register it!
    if (!AssetInfo.isIbcDenom(denom)) {
      return this.assetRegistry.register(new AnsAssetEntry(symbol, assetInfo))
    }

    // fetch the known ibc assets to compare
    const knownIbcAssets = await this.fetchIbcAssets()

    const matchingIbcAsset = knownIbcAssets.find((a) => a.juno_denom === denom)
    if (!matchingIbcAsset) {
      console.log(`Didn't find ${denom} ${symbol} in ${knownIbcAssets.length}`)
      // throw new Error(`No IBC asset found for denom ${denom}`)
      this.assetRegistry.unknownAsset(symbol, denom)
      return
    }

    const ibcAssetName = AnsName.chainIdIbcAsset(matchingIbcAsset.chain_id, matchingIbcAsset.symbol)
    return this.assetRegistry.register(new AnsAssetEntry(ibcAssetName, assetInfo))
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
