import { Chain } from '@chain-registry/types'
import { Cw20QueryClient } from '@abstract-os/abstract.js'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { bech32 } from 'bech32'
import { RPC_OVERRIDES } from '../networks/network'

/**
 * A class wrapping the Cw20QueryClient to provide some helper methods.
 */
export class Cw20Helper {
  queryClient: Cw20QueryClient

  constructor(queryClient: Cw20QueryClient) {
    this.queryClient = queryClient
  }

  static async init(chain: Chain, address: string) {
    const addrPrefix = bech32.decode(address).prefix
    if (addrPrefix !== chain.bech32_prefix) {
      throw new Error(
        `Incorrect chain. Found prefix: ${addrPrefix}, expected: ${chain.bech32_prefix}`
      )
    }

    const queryClient = new Cw20QueryClient(
      await CosmWasmClient.connect(
        // @ts-ignore
        RPC_OVERRIDES[chain.chain_id] ?? chain.apis!.rpc!.at(0)!.address
      ),
      address
    )

    return new Cw20Helper(queryClient)
  }

  /**
   * Get the lowercase symbol of the cw20 token.
   */
  async getSymbol() {
    try {
      const info = await this.queryClient.tokenInfo()
      await new Promise((resolve) => setTimeout(resolve, 300))
      const symbol = info.symbol.toLowerCase()
      return symbol
    } catch (e) {
      throw new Error(`Failed to query cw20 symbol for ${this.queryClient.contractAddress}: ${e}`)
    }
  }
}
