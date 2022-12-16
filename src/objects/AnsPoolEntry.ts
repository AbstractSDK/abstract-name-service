export class AnsPoolEntry {
  id: AbstractPoolId
  metadata: AbstractPoolMetadata

  constructor(id: AbstractPoolId, metadata: AbstractPoolMetadata) {
    this.id = id
    this.metadata = metadata
  }

  public equals(other: AnsPoolEntry): boolean {
    return (
      this.id.toString() === other.id.toString() &&
      this.metadata.toString() === other.metadata.toString()
    )
  }
  toJSON(): [AbstractPoolId, AbstractPoolMetadata] {
    return [this.id, this.metadata]
  }
}
