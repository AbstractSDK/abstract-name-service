import { AnsAssetEntry } from './AnsAssetEntry'

export class AnsAssetEntryList {
  entries: AnsAssetEntry[]
  constructor() {
    this.entries = []
  }

  public push(entry: AnsAssetEntry) {
    if (!this.contains(entry)) {
      this.entries.push(entry)
    }
  }

  public contains(entry: AnsAssetEntry) {
    return this.entries.some((e) => e.equals(entry))
  }

  public toJSON() {
    return this.entries
  }
}
