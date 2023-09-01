import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { Network } from './network'
import { AssetRegistry } from '../registry/assetRegistry'
import { AstroportGql } from '../exchanges/astroportgql'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Pacific1Options {}

const PACIFIC_1 = 'pacific-1'

export class Pacific1 extends Network {
  private options: Pacific1Options

  constructor(
    assetRegistry: AssetRegistry,
    contractRegistry: ContractRegistry,
    poolRegistry: PoolRegistry,
    options: Pacific1Options = {}
  ) {
    super({
      networkId: PACIFIC_1,
      assetRegistry,
      contractRegistry,
      poolRegistry,
      exchanges: [
        new AstroportGql({
          contractsUrl:
            'https://raw.githubusercontent.com/astroport-fi/astroport-changelog/main/sei/sei-1/core_mainnet.json',
          cacheSuffix: PACIFIC_1,
          graphQlEndpoint: 'https://multichain-api.astroport.fi/graphql',
        }),
      ],
    })
    this.options = options
  }
}
