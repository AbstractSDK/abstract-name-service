import { AnsPoolEntry, PoolId } from '../objects'

export interface RegistryDefaults {
  contractRegistry?: AnsPoolEntry[]
}

export class PoolRegistry {
  protected registry: AnsPoolEntry[]

  constructor(defaults: RegistryDefaults = {}) {
    const { contractRegistry } = defaults
    this.registry = contractRegistry || []
  }

  public register(poolEntry: AnsPoolEntry): AnsPoolEntry {
    console.log(`Registering pool ${JSON.stringify(poolEntry.id)}: ${poolEntry.metadata}`)

    const existing = this.getRegistered(poolEntry.id)

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

  public getRegistered(poolId: PoolId): AnsPoolEntry | undefined {
    return this.registry.find((e) => JSON.stringify(e.id) === JSON.stringify(poolId))
  }

  public export(): AnsPoolEntry[] {
    return this.registry
  }
}
