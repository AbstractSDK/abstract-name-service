export class AnsAssetEntry {
  name: string
  info: AbstractAssetInfo

  constructor(name: string, info: AbstractAssetInfo) {
    this.name = name.toLowerCase()
    this.info = info
  }
  public equals(other: AnsAssetEntry): boolean {
    return this.name === other.name && this.info.toString() === other.info.toString()
  }

  toJSON() {
    return [this.name, this.info]
  }
}
