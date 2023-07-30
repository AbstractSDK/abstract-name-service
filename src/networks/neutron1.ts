import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { Network } from './network'
import { AssetRegistry } from '../registry/assetRegistry'
import { AstroportGql } from '../exchanges/astroportgql'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Neutron1Options {}

const NEUTRON_1 = 'neutron-1'

export class Neutron1 extends Network {
  private options: Neutron1Options

  constructor(
    assetRegistry: AssetRegistry,
    contractRegistry: ContractRegistry,
    poolRegistry: PoolRegistry,
    options: Neutron1Options = {}
  ) {
    super({
      networkId: NEUTRON_1,
      assetRegistry,
      contractRegistry,
      poolRegistry,
      exchanges: [
        new AstroportGql({
          contractsUrl:
            'https://raw.githubusercontent.com/astroport-fi/astroport-changelog/main/neutron/neutron-1/core_mainnet.json',
          cacheSuffix: NEUTRON_1,
          graphQlEndpoint: 'https://multichain-api.astroport.fi/graphql',
        }),
      ],
    })
    this.options = options
  }
}
