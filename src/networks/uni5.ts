import { NetworkRegistry, RegistryDefaults } from './networkRegistry'
import { Exchange } from '../exchanges/exchange'
import { Network } from './network'
import { Junoswap } from '../exchanges/junoswap'
import { AnsAssetEntry, AssetInfo } from '../objects'
import { AnsName } from '../objects/AnsName'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Uni5Options {}

const UNI_5 = 'uni-5'

export class Uni5 extends Network {
  private options: Uni5Options

  constructor(registry: NetworkRegistry, options: Uni5Options = {}) {
    super(UNI_5, registry, [
      new Junoswap({
        poolListUrl: 'https://wasmswap.io/pools_list.testnet.json',
      }),
    ])
    this.options = options
  }
}
