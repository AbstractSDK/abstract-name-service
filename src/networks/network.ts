import { NetworkRegistry } from './networkRegistry'
import { Exchange } from '../exchanges/exchange'
import { chains } from 'chain-registry'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { AnsAssetEntry } from '../objects'

export abstract class Network {
  networkId: string
  registry: NetworkRegistry

  constructor(networkId: string, registry: NetworkRegistry) {
    this.networkId = networkId
    this.registry = registry
  }

  abstract registerNativeAsset(unresolved: {
    denom: string
    symbol: string
  }): Promise<AnsAssetEntry>

  public registerAsset(assetEntry: AnsAssetEntry) {
    return this.registry.registerAsset(assetEntry)
  }

  public getRegisteredAsset(assetName: string): CwAssetInfo | undefined {
    return this.registry.getRegisteredAsset(assetName)
  }

  public getRegisteredSymbolByAddress(denom: string): string | undefined {
    return this.registry.getRegisteredSymbolByAddress(denom)
  }

  public async queryClient(): Promise<CosmWasmClient> {
    return CosmWasmClient.connect(this.rpcUrl())
  }

  private rpcUrl(): string {
    const rpc = chains.find(({ chain_id }) => chain_id === this.networkId)?.apis?.rpc?.[0]?.address
    if (!rpc) throw new Error(`No RPC found for network ${this.networkId}`)
    return rpc
  }

  abstract registerIbcAssets(): Promise<void>
}
