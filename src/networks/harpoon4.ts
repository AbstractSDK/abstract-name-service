import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { Network } from './network'
import { AssetRegistry } from '../registry/assetRegistry'
import { Fin } from '../exchanges/fin'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Harpoon4Options {}

const HARPOON_4 = 'harpoon-4'

export class Harpoon4 extends Network {
  private options: Harpoon4Options

  constructor(
    assetRegistry: AssetRegistry,
    contractRegistry: ContractRegistry,
    poolRegistry: PoolRegistry,
    options: Harpoon4Options = {}
  ) {
    super({
      networkId: HARPOON_4,
      assetRegistry,
      contractRegistry,
      poolRegistry,
      exchanges: [
        new Fin({
          contractsUrl:
            'https://raw.githubusercontent.com/Team-Kujira/kujira.js/master/src/resources/contracts.json',
          cacheSuffix: HARPOON_4,
        }),
      ],
    })
    this.options = options
  }
}
