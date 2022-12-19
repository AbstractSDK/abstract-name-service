import { assets } from 'chain-registry'
import { AssetInfo } from './AssetInfo'

export class AnsAssetEntry {
  name: string
  info: CwAssetInfo

  constructor(name: string, info: CwAssetInfo) {
    this.name = name.toLowerCase()
    this.info = info
  }

  public equals(other: AnsAssetEntry): boolean {
    return this.name === other.name && this.info.toString() === other.info.toString()
  }

  public isIbc(): boolean {
    return 'native' in this.info && AssetInfo.isIbcDenom(this.info.native)
  }

  toJSON(): [string, CwAssetInfo] {
    return [this.name, this.info]
  }
}

export class UncheckedAssetInfo {
  name: string
  address: string

  constructor(name: string, address: string) {
    this.name = name.toLowerCase()
    this.address = address
  }
}
