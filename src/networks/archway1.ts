import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { Network } from './network'
import { AssetRegistry } from '../registry/assetRegistry'
import { Astrovault } from '../exchanges/astrovault'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Archway1Options {}

const ARCHWAY_1 = 'archway-1'

export class Archway1 extends Network {
  private options: Archway1Options

  constructor(
    assetRegistry: AssetRegistry,
    contractRegistry: ContractRegistry,
    poolRegistry: PoolRegistry,
    options: Archway1Options = {}
  ) {
    super({
      networkId: ARCHWAY_1,
      assetRegistry,
      contractRegistry,
      poolRegistry,
      exchanges: [
        new Astrovault({
          pairFactoryAddress: 'archway1cq6tgc32az7zpq5w7t2d89taekkn9q95g2g79ka6j46ednw7xkkq7n55a2',
          poolFactoryAddress: 'archway19yzx44k7w7gsjjhumkd4sh9r0z6lscq583hgpu9s4yyl00z9lahq0ptra0',
          cacheSuffix: ARCHWAY_1,
        }),
      ],
    })
    this.options = options
  }
}
