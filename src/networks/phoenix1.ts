import { NetworkRegistry } from './networkRegistry'
import { AnsAssetEntry } from '../objects'

export class Phoenix1 extends NetworkRegistry {

  registerNativeAsset(_unresolved: { denom: string; symbol: string }): Promise<AnsAssetEntry> {
    throw new Error('Method not implemented.')
  }
}
