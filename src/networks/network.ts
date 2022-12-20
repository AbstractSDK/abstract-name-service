import { chains } from 'chain-registry'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { AnsAssetEntry, AnsContractEntry, AnsPoolEntry, AssetInfo } from '../objects'
import { Exchange } from '../exchanges'
import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'


interface INetwork {
  networkId: string
  assetRegistry: AssetRegistry
  contractRegistry: ContractRegistry
  poolRegistry: PoolRegistry
  exchanges: Exchange[]
}

export abstract class Network {
  networkId: string
  assetRegistry: AssetRegistry
  contractRegistry: ContractRegistry
  poolRegistry: PoolRegistry
  private exchanges: Exchange[]

  protected constructor({
    networkId,
    assetRegistry,
    contractRegistry,
    poolRegistry,
    exchanges,
  }: INetwork) {
    this.networkId = networkId
    this.assetRegistry = assetRegistry
    this.contractRegistry = contractRegistry
    this.poolRegistry = poolRegistry
    this.exchanges = exchanges
  }

  /** if it's a native asset, we check if its registered already. If not registered, it is not a preknown asset, so we generate a new entry */
  public async registerNativeAsset({ denom, symbol }: { denom: string; symbol: string }) {
    const assetInfo = AssetInfo.native(denom)

    // If it's not IBC, register it!
    if (!AssetInfo.isIbcDenom(denom)) {
      return this.assetRegistry.register(new AnsAssetEntry(symbol, assetInfo))
    }

    // We don't know any ibc denoms by default
    this.assetRegistry.unknownAsset(symbol, denom)
  }

  public getRegisteredSymbolByAddress(address: string): string | undefined {
    return this.assetRegistry.getRegisteredSymbolByAddress(address)
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
    return this.assetRegistry.export()
  }

  async exportContracts(): Promise<AnsContractEntry[]> {
    await Promise.all(this.exchanges.map((exchange) => exchange.registerContracts(this)))
    return this.contractRegistry.export()
  }

  async exportPools(): Promise<AnsPoolEntry[]> {
    await Promise.all(this.exchanges.map((exchange) => exchange.registerPools(this)))
    return this.poolRegistry.export()
  }
}
