export class AnsPoolEntry {
  id: AbstractPoolId
  metadata: AbstractPoolMetadata

  constructor(id: AbstractPoolId, metadata: AbstractPoolMetadata) {
    this.id = id
    this.metadata = metadata
  }

  public equals(other: AnsPoolEntry): boolean {
    return (
      JSON.stringify(this.id) === JSON.stringify(other.id) &&
      JSON.stringify(this.metadata) === JSON.stringify(other.metadata)
    )
  }
  toJSON(): [AbstractPoolId, AbstractPoolMetadata] {
    return [this.id, this.metadata]
  }
}
