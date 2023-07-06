// eslint-disable-next-line @typescript-eslint/no-empty-interface
import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { Network } from './network'
import { Junoswap } from '../exchanges'
import { AssetRegistry } from '../registry/assetRegistry'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Uni5Options {}

const UNI_6 = 'uni-6'

export class Uni5 extends Network {
  private options: Uni5Options

  constructor(
    assetRegistry: AssetRegistry,
    contractRegistry: ContractRegistry,
    poolRegistry: PoolRegistry,
    options: Uni5Options = {}
  ) {
    super({
      networkId: UNI_6,
      assetRegistry: assetRegistry,
      contractRegistry: contractRegistry,
      poolRegistry: poolRegistry,
      exchanges: [
        new Junoswap({
          poolListUrl: 'https://wasmswap.io/pools_list.testnet.json',
        }),
      ],
    })
    this.options = options
  }
}
