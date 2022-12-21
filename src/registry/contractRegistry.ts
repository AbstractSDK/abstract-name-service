import { AnsContractEntry } from '../objects'
import { AlreadyRegisteredError, IRegistry } from './IRegistry'

export interface RegistryDefaults {
  contractRegistry?: AnsContractEntry[]
}

export class ContractRegistry implements IRegistry<AnsContractEntry> {
  protected contractRegistry: AnsContractEntry[]
  protected unknownRegistry: AnsContractEntry[] = []

  constructor(defaults: RegistryDefaults = {}) {
    const { contractRegistry } = defaults
    this.contractRegistry = contractRegistry || []
  }

  public register(contractEntry: AnsContractEntry): AnsContractEntry {
    console.log(
      `Registering contract ${JSON.stringify(contractEntry.info)}: ${contractEntry.address}`
    )

    const existing = this.getRegistered(contractEntry.info)
    if (existing) {
      if (!existing.equals(contractEntry)) {
        // TODO: unknown contracts
        throw new AlreadyRegisteredError(
          `Contract ${JSON.stringify(contractEntry.info)}:${
            contractEntry.address
          } already registered with different info`
        )
      }
      // If the contract is already registered, we don't need to do anything
      return existing
    }

    this.contractRegistry.push(contractEntry)

    return contractEntry
  }

  public getRegistered(contractInfo: AbstractContractEntry): AnsContractEntry | undefined {
    return this.contractRegistry.find(
      (e) => JSON.stringify(e.info) === JSON.stringify(contractInfo)
    )
  }

  public export(): AnsContractEntry[] {
    return this.contractRegistry
  }

  unknown(entry: AnsContractEntry): void {
    console.warn(
      `Adding unknown contract: ${JSON.stringify(entry.info)} with address: ${entry.address}`
    )
    this.unknownRegistry.push(entry)
  }
}
