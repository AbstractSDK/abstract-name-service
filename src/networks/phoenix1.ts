import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { Network } from './network'
import { Astroport } from '../exchanges'
import { AssetRegistry } from '../registry/assetRegistry'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Phoenix1Options {}

const PHOENIX_1 = 'phoenix-1'

export class Phoenix1 extends Network {
  private options: Phoenix1Options

  constructor(
    assetRegistry: AssetRegistry,
    contractRegistry: ContractRegistry,
    poolRegistry: PoolRegistry,
    options: Phoenix1Options = {}
  ) {
    super({
      networkId: PHOENIX_1,
      assetRegistry,
      contractRegistry,
      poolRegistry,
      exchanges: [
        new Astroport({
          contractsUrl:
            'https://raw.githubusercontent.com/astroport-fi/astroport-changelog/main/terra-2/phoenix-1/core_phoenix.json',
          cacheSuffix: PHOENIX_1,
        }),
      ],
    })
    this.options = options
  }
}
