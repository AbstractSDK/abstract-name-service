export class AnsContractEntry {
  info: AbstractContractEntry
  address: string

  constructor(protocol: string, contract: string, address: string) {
    this.info = { protocol, contract }
    this.address = address
  }
  public equals(other: AnsContractEntry): boolean {
    return (
      this.info.protocol === other.info.protocol &&
      this.info.contract === other.info.contract &&
      this.address === other.address
    )
  }

  toJSON(): [AbstractContractEntry, string] {
    return [this.info, this.address]
  }
}
