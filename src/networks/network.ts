import { NetworkRegistry } from './networkRegistry'
import { Exchange } from '../exchanges/exchange'
import { chains } from 'chain-registry'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'

export abstract class Network {
  networkId: string
  registry: NetworkRegistry
  exchanges: Exchange[]

  constructor(networkId: string, registry: NetworkRegistry, exchanges: Exchange[]) {
    this.networkId = networkId
    this.registry = registry
    this.exchanges = exchanges
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
