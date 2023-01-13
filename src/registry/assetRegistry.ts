import { chains } from 'chain-registry'
import { AnsAssetEntry } from '../objects'
import { match, P } from 'ts-pattern'
import { IRegistry, NotFoundError } from './IRegistry'

export interface RegistryDefaults {
  assetRegistry?: Map<string, CwAssetInfo>
  contractRegistry?: Map<string, string>
}

export class AssetRegistry implements IRegistry<AnsAssetEntry> {
  protected assetRegistry: Map<string, CwAssetInfo>
  protected unknownAssetRegistry: Map<string, string>
  protected skippedRegistry: Map<string, Set<CwAssetInfo>>

  constructor(defaults: RegistryDefaults = {}) {
    const { assetRegistry, contractRegistry } = defaults
    this.assetRegistry = assetRegistry || new Map()
    this.unknownAssetRegistry = new Map()
    this.skippedRegistry = new Map()
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

    if (existing && JSON.stringify(existing) != JSON.stringify(assetEntry.info)) {
      console.warn(
        `Asset ${assetEntry.name}:${JSON.stringify(
          assetEntry.info
        )} already registered with different info: ${JSON.stringify(existing)}`
      )

      // Skip this asset
      if (!this.skippedRegistry.has(assetEntry.name)) {
        this.skippedRegistry.set(assetEntry.name, new Set())
      }
      this.skippedRegistry.get(assetEntry.name)?.add(assetEntry.info)
      this.skippedRegistry.get(assetEntry.name)?.add(existing)

      return
    }

    if (this.skippedRegistry.has(assetEntry.name)) {
      console.warn(
        `Asset ${assetEntry.name} was skipped previously with different info: ${JSON.stringify(
          this.skippedRegistry.get(assetEntry.name)
        )}`
      )
      return
    }

    this.assetRegistry.set(assetEntry.name, assetEntry.info)
    return assetEntry
  }

  public has(assetName: string): boolean {
    return this.assetRegistry.has(assetName)
  }

  public hasSkipped(assetName: string): boolean {
    return (
      this.skippedRegistry.has(assetName) ||
      [...this.skippedRegistry.values()].some((s) => JSON.stringify(s).includes(assetName))
    )
  }

  public hasDenom(denom: string): boolean {
    return this.getByDenom(denom) !== undefined
  }

  public get(assetName: string): CwAssetInfo | undefined {
    return this.assetRegistry.get(assetName)
  }

  /**
   * Returns the asset symbol of the registered asset if found.
   */
  public getByDenom(denom: string): string | undefined {
    const entry = Array.from(this.assetRegistry?.entries() || []).find(([name, info]) =>
      match(info)
        .with({ native: P.select() }, (native) => native === denom)
        .with({ cw20: P.select() }, (cw20) => cw20 === denom)
        .otherwise(() => {
          false
        })
    )

    return entry?.[0]
  }

  public getNamesByDenoms(denoms: string[]): string[] {
    return denoms.map((denom) => {
      const registered = this.getByDenom(denom)
      if (!registered) {
        throw new NotFoundError(`No registered asset found for ${denom}`)
      }
      return registered
    })
  }

  public export(): AnsAssetEntry[] {
    return Array.from(this.assetRegistry.entries()).map(AnsAssetEntry.fromEntry)
  }

  unknown(entry: AnsAssetEntry): void {
    this.unknownAssetRegistry.set(entry.name, entry.info.toString())
  }
}
