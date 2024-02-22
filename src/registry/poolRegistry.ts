import { AnsPoolEntry, PoolId } from '../objects'
import { IRegistry } from './IRegistry'

export interface RegistryDefaults {
  contractRegistry?: AnsPoolEntry[]
}

export class PoolRegistry implements IRegistry<AnsPoolEntry> {
  protected registry: AnsPoolEntry[]
  protected unknownRegistry: AnsPoolEntry[] = []

  constructor(defaults: RegistryDefaults = {}) {
    const { contractRegistry } = defaults
    this.registry = contractRegistry || []
  }

  public register(poolEntry: AnsPoolEntry): AnsPoolEntry {
    console.log(
      `Registering pool ${JSON.stringify(poolEntry.id)}: ${JSON.stringify(poolEntry.metadata)}`
    )

    const existing = this.get(poolEntry.id)

    if (existing) {
      if (!existing.equals(poolEntry)) {
        // TODO: unknown contracts
        throw new Error(
          `Pool ${JSON.stringify(poolEntry.id)}:${
            poolEntry.metadata
          } already registered with different info`
        )
      }
      // If the pool is already registered, we don't need to do anything
      return existing
    }

    this.registry.push(poolEntry)

    return poolEntry
  }

  public get(poolId: PoolId): AnsPoolEntry | undefined {
    return this.registry.find((e) => JSON.stringify(e.id) === JSON.stringify(poolId))
  }

  public has(poolId: PoolId): boolean {
    return this.get(poolId) !== undefined
  }

  public unknown(poolEntry: AnsPoolEntry) {
    console.warn(
      `Adding unknown pool: ${JSON.stringify(poolEntry.id)} with metadata: ${JSON.stringify(
        poolEntry.metadata
      )}`
    )
    this.unknownRegistry.push(poolEntry)
  }

  public export(): AnsPoolEntry[] {
    return this.registry
  }
}
