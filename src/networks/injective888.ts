import { Network } from './network'
import { AssetRegistry } from '../registry/assetRegistry'
import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { Astroport } from '../exchanges'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Pisco1Options {}

const INJECTIVE_888 = 'injective-888'

export class Injective888 extends Network {
  private options: Pisco1Options

  constructor(
    assetRegistry: AssetRegistry,
    contractRegistry: ContractRegistry,
    poolRegistry: PoolRegistry,
    options: Pisco1Options = {}
  ) {
    super({
      networkId: INJECTIVE_888,
      assetRegistry: assetRegistry,
      contractRegistry: contractRegistry,
      poolRegistry: poolRegistry,
      exchanges: [
        new Astroport({
          contractsUrl:
            'https://github.com/astroport-fi/astroport-changelog/blob/main/injective/injective-888/core_testnet.json',
        }),
      ],
    })
    this.options = options
  }
}
