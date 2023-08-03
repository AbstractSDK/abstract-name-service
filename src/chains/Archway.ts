import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Archway1 } from '../networks/archway1'

const archway_1 = new Archway1(
  new AssetRegistry({
    assetRegistry: new Map([
      [
        'axelar>usdc',
        {
          native: 'ibc/B9E4FD154C92D3A23BEA029906C4C5FF2FE74CB7E3A058290B77197A263CF88B',
        },
      ],
      [
        'jackal>jkl',
        {
          native: 'ibc/926432AE1C5FA4F857B36D970BE7774C7472079506820B857B75C5DE041DD7A3',
        },
      ],
    ]),
  }),
  new ContractRegistry(),
  new PoolRegistry()
)

export class Archway extends Chain {
  constructor() {
    super('archway', [archway_1])
  }
}
