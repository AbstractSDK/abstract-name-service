import { chains } from 'chain-registry'
import { AnsAssetEntry } from '../objects'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { match, P } from 'ts-pattern'
import { Exchange } from '../exchanges/exchange'

export interface RegistryDefaults {
  assetRegistry?: Map<string, CwAssetInfo>
  contractRegistry?: Map<string, string>
}

export class AssetRegistry {
  protected assetRegistry: Map<string, CwAssetInfo>
  protected unknownAssetRegistry: Map<string, string>

  constructor(defaults: RegistryDefaults = {}) {
    const { assetRegistry, contractRegistry } = defaults
    this.assetRegistry = assetRegistry || new Map()
    this.unknownAssetRegistry = new Map()
  }

  static nativeAssetDenoms(chainId: string): string[] {
    return (
      chains.find((c) => c.chain_id === chainId)?.staking?.staking_tokens.map((t) => t.denom) ?? []
    )
  }

  public unknownAsset(name: string, address: string) {
    console.warn(`Adding unknown asset: ${name} with address: ${address}`)
    this.unknownAssetRegistry.set(name, address)
  }

  public register(assetEntry: AnsAssetEntry) {
    console.log(`Registering asset ${assetEntry.name}: ${JSON.stringify(assetEntry.info)}`)

    const existing = this.get(assetEntry.name)
    if (existing && existing.toString() !== assetEntry.info.toString()) {
      throw new Error(
        `Asset ${assetEntry.name}:${assetEntry.info} already registered with different info`
      )
    }

    this.assetRegistry.set(assetEntry.name, assetEntry.info)
    return assetEntry
  }

  public has(assetName: string): boolean {
    return this.assetRegistry.has(assetName)
  }

  public hasDenom(denom: string): boolean {
    return this.getDenom(denom) !== undefined
  }

  public get(assetName: string): CwAssetInfo | undefined {
    return this.assetRegistry.get(assetName)
  }


  /**
   * Returns the asset symbol of the registered asset if found.
   */
  public getDenom(address: string): string | undefined {
    const entry = Array.from(this.assetRegistry?.entries() || []).find(([k, v]) =>
      match(v)
        .with({ native: P.string }, ({ native }) => native === address)
        .with({ cw20: P.string }, ({ cw20 }) => cw20 === address)
        .otherwise(() => false)
    )

    return entry?.[0]
  }

  public getNamesByAddresses(addresses: string[]): string[] {
    return addresses.map((address) => {
      const registered = this.getDenom(address)
      if (!registered) {
        throw new Error(`No registered asset found for ${address} }`)
      }
      return registered
    })
  }

  public export(): AnsAssetEntry[] {
    return Array.from(this.assetRegistry.entries()).map(AnsAssetEntry.fromEntry)
  }
}
