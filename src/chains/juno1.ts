import { AnsAssetEntry, AssetInfo } from '../objects'
import { AnsName } from '../objects/AnsName'
import { Network } from './network'
import { match, P } from 'ts-pattern'
import { BiMap } from 'mnemonist'
const JUNO_1 = 'juno-1'

export class Juno1 extends Network {
  private fetchedIbcAssetsCache: JunoswapIbcAsset[]

  private ibcAssetList = {
    'juno-1':
      'https://raw.githubusercontent.com/CosmosContracts/junoswap-asset-list/main/ibc_assets.json',
  } as const

  constructor(assetRegistry?: Map<string, CwAssetInfo>) {
    super(JUNO_1, assetRegistry)

    this.fetchedIbcAssetsCache = []
  }

  public registerAsset(assetEntry: AnsAssetEntry) {
    console.log(`Registering asset ${assetEntry.name}`)

    const existing = this.assetRegistry.get(assetEntry.name)
    if (existing && existing.toString() !== assetEntry.info.toString()) {
      throw new Error(
        `Asset ${assetEntry.name}:${assetEntry.info} already registered with different info`
      )
    }

    this.assetRegistry.set(assetEntry.name, assetEntry.info)
    return assetEntry
  }

  public getRegisteredAsset(assetName: string): CwAssetInfo | undefined {
    return this.assetRegistry?.get(assetName)
  }

  /**
   * Returns the asset symbol of the registered asset if found.
   */
  public getRegisteredSymbolByAddress(denom: string): string | undefined {
    const entry = Array.from(this.assetRegistry?.entries() || []).find(([k, v]) =>
      match(v)
        .with({ native: P.string }, ({ native }) => native === denom)
        .with({ cw20: P.string }, ({ cw20 }) => cw20 === denom)
        .otherwise(() => false)
    )

    return entry?.[0]
  }

  private async fetchKnownIbcAssets(): Promise<JunoswapIbcAsset[]> {
    if (this.fetchedIbcAssetsCache) {
      return this.fetchedIbcAssetsCache
    }

    // @ts-ignore
    const ibcAssetsUrl = this.ibcAssetList[network as any]
    if (!ibcAssetsUrl) return []

    const ibcAssets: JunoswapIbcAssets = await fetch(ibcAssetsUrl).then((res) => res.json())
    this.fetchedIbcAssetsCache = ibcAssets.tokens

    return ibcAssets.tokens
  }

  async registerNativeAsset(
    unresolved: { denom: string; symbol: string }
  ): Promise<AnsAssetEntry> {
    const { denom, symbol } = unresolved

    const assetInfo = AssetInfo.native(denom)

    const registered = this.getRegisteredAsset(symbol)
    if (registered) {
      if (registered.toString() !== assetInfo.toString()) {
        throw new Error(
          `Asset ${symbol} already registered with different info`
        )
      }
      // otherwise, just return happy path
      return new AnsAssetEntry(symbol, registered)
    }

    // If its not IBC, register it!
    if (!AssetInfo.isIbcDenom(denom)) {
      return this.registerAsset(new AnsAssetEntry(symbol, assetInfo))
    }

    const knownIbcAssets = await this.fetchKnownIbcAssets()

    const matchingIbcAsset = knownIbcAssets.find((a) => a.juno_denom === denom)
    if (!matchingIbcAsset) {
      throw new Error(`No IBC asset found for denom ${denom}`)
    }

    const ibcAssetName = AnsName.ibcAsset(matchingIbcAsset.chain_id, matchingIbcAsset.symbol)
    return this.registerAsset(new AnsAssetEntry(ibcAssetName, assetInfo))
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
