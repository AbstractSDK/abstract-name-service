import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { Network } from './network'
import { AssetRegistry } from '../registry/assetRegistry'
import { AstroportGql } from '../exchanges/astroportgql'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Atlantic2Options {}

const ATLANTIC_2 = 'atlantic-2'

export class Atlantic2 extends Network {
  private options: Atlantic2Options

  constructor(
    assetRegistry: AssetRegistry,
    contractRegistry: ContractRegistry,
    poolRegistry: PoolRegistry,
    options: Atlantic2Options = {}
  ) {
    super({
      networkId: ATLANTIC_2,
      assetRegistry,
      contractRegistry,
      poolRegistry,
      exchanges: [
        new AstroportGql({
          contractsUrl:
            'https://raw.githubusercontent.com/astroport-fi/astroport-changelog/main/sei/atlantic-2/core_testnet.json',
          cacheSuffix: ATLANTIC_2,
          graphQlEndpoint: 'https://multichain-api.astroport.fi/graphql',
          astroContractsOverrides: {
            astro_token_address:
              'ibc/4552BF8EE9C7AFD889CACF426F866350AAE28DC73507B1411972C8C1B9B38732',
          },
        }),
      ],
    })
    this.options = options
  }
}
