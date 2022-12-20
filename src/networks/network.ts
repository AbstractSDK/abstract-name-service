import { NetworkRegistry } from './networkRegistry'
import { Exchange } from '../exchanges/exchange'
import { chains } from 'chain-registry'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { AnsAssetEntry, AssetInfo } from '../objects'

export abstract class Network {
  networkId: string
  registry: NetworkRegistry
  private exchanges: Exchange[]

  constructor(networkId: string, registry: NetworkRegistry, exchanges: Exchange[]) {
    this.networkId = networkId
    this.registry = registry
    this.exchanges = exchanges
  }

  registerExchangeAssets() {
    this.exchanges.forEach((exchange) => exchange.registerAssets(this))
  }

  /** if it's a native asset, we check if its registered already. If not registered, it is not a preknown asset, so we generate a new entry */
  public async registerNativeAsset({ denom, symbol }: { denom: string; symbol: string }) {
    const assetInfo = AssetInfo.native(denom)

    // If it's not IBC, register it!
    if (!AssetInfo.isIbcDenom(denom)) {
      return this.registry.registerAsset(new AnsAssetEntry(symbol, assetInfo))
    }

    // We don't know any ibc denoms by default
    this.registry.unknownAsset(symbol, denom)
  }

  public registerAsset(assetEntry: AnsAssetEntry) {
    return this.registry.registerAsset(assetEntry)
  }

  public getRegisteredAsset(assetName: string): CwAssetInfo | undefined {
    return this.registry.getRegisteredAsset(assetName)
  }

  public getRegisteredSymbolByAddress(address: string): string | undefined {
    return this.registry.getRegisteredSymbolByAddress(address)
  }

  public async queryClient(): Promise<CosmWasmClient> {
    return CosmWasmClient.connect(this.rpcUrl())
  }

  private rpcUrl(): string {
    const rpc = chains.find(({ chain_id }) => chain_id === this.networkId)?.apis?.rpc?.[0]?.address
    if (!rpc) throw new Error(`No RPC found for network ${this.networkId}`)
    return rpc
  }

  async exportAssets(): Promise<AnsAssetEntry[]> {
    await Promise.all(this.exchanges.map((exchange) => exchange.registerAssets(this)))
    return this.registry.exportAssets()
  }
}
