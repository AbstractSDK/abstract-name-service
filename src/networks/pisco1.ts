import { Network } from './network'
import { AssetRegistry } from '../registry/assetRegistry'
import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { Astroport } from '../exchanges'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Pisco1Options {}

const PISCO_1 = 'pisco-1'

export class Pisco1 extends Network {
  private options: Pisco1Options

  constructor(
    assetRegistry: AssetRegistry,
    contractRegistry: ContractRegistry,
    poolRegistry: PoolRegistry,
    options: Pisco1Options = {}
  ) {
    super({
      networkId: PISCO_1,
      assetRegistry: assetRegistry,
      contractRegistry: contractRegistry,
      poolRegistry: poolRegistry,
      exchanges: [
        new Astroport({
          contractsUrl:
            'https://raw.githubusercontent.com/astroport-fi/astroport-changelog/main/terra-2/pisco-1/core_pisco.json',
            cacheSuffix: PISCO_1
        }),
      ],
    })
    this.options = options
  }
}
