import { chains } from 'chain-registry'
import { AnsAssetEntry, AssetInfo } from '../objects'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'

type NetworkId = string
export abstract class Network {
  networkId: string
  assetRegistry: Map<string, CwAssetInfo>
  contractRegistry: Map<string, string>

  protected constructor(networkId: string, assetRegistry?: Map<string, CwAssetInfo>) {
    this.networkId = networkId
    this.assetRegistry = assetRegistry || new Map()
    this.contractRegistry = new Map()
  }

  rpcUrl(): string {
    const rpc = chains.find(({ chain_id }) => chain_id === this.networkId)?.apis?.rpc?.[0]
      ?.address
    if (!rpc) throw new Error(`No RPC found for network ${this.networkId}`)
    return rpc
  }

  async queryClient(): Promise<CosmWasmClient> {
    return CosmWasmClient.connect(this.rpcUrl())
  }

  abstract registerAsset(assetEntry: AnsAssetEntry): void
  abstract registerNativeAsset(
    unresolved: { denom: string; symbol: string }
  ): Promise<AnsAssetEntry>
  abstract getRegisteredAsset(assetName: string): CwAssetInfo | undefined
  abstract getRegisteredSymbolByAddress(denom: string): string | undefined

  static nativeAssetDenoms(chainId: string): string[] {
    return (
      chains.find((c) => c.chain_id === chainId)?.staking?.staking_tokens.map((t) => t.denom) ?? []
    )
  }
}
