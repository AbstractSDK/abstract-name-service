import { chains } from 'chain-registry'
import { AnsAssetEntry } from '../objects'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { match, P } from 'ts-pattern'
import { Exchange } from '../exchanges/exchange'

export interface NetworkDefaults {
  assetRegistry?: Map<string, CwAssetInfo>
  contractRegistry?: Map<string, string>
}

export class NetworkRegistry {
  protected assetRegistry: Map<string, CwAssetInfo>
  protected contractRegistry: Map<string, string>

  constructor(
    defaults: NetworkDefaults = {}
  ) {
    const { assetRegistry, contractRegistry } = defaults
    this.assetRegistry = assetRegistry || new Map()
    this.contractRegistry = contractRegistry || new Map()
  }

  static nativeAssetDenoms(chainId: string): string[] {
    return (
      chains.find((c) => c.chain_id === chainId)?.staking?.staking_tokens.map((t) => t.denom) ?? []
    )
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
}
