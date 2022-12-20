

// eslint-disable-next-line @typescript-eslint/no-empty-interface
import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { Network } from './network'
import { Junoswap } from '../exchanges'
import { AssetRegistry } from '../registry/assetRegistry'

interface Uni5Options {}

const UNI_5 = 'uni-5'

export class Uni5 extends Network {
  private options: Uni5Options

  constructor(
    assetRegistry: AssetRegistry,
    contractRegistry: ContractRegistry,
    poolRegistry: PoolRegistry,
    options: Uni5Options = {}
  ) {
    super({
      networkId: UNI_5,
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
