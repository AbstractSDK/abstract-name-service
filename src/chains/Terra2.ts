import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Pisco1 } from '../networks/pisco1'
import { Phoenix1 } from '../networks/phoenix1'

// const phoenix_1 = new Phoenix1(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())
const pisco_1 = new Pisco1(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())
const phoenix_1 = new Phoenix1(
  new AssetRegistry({
    assetRegistry: new Map([
      [
        'eth>axelar>usdc',
        {
          native: 'ibc/B3504E092456BA618CC28AC671A71FB08C6CA0FD0BE7C8A5B5A3E2DD933CC9E4',
        },
      ],
      [
        'eth>axelar>usdt',
        {
          native: 'ibc/CBF67A2BCF6CAE343FDF251E510C8E18C361FC02B23430C121116E0811835DEF',
        },
      ],
      [
        'noble>usdc',
        {
          native: 'ibc/8198819CC2F25B16991D6391826B6BFA50F03AB6B5688C3399BB6A7BD5CCA53C',
        },
      ],
      [
        'eth>axelar>weth',
        {
          native: 'ibc/BC8A77AFBD872FDC32A348D3FB10CC09277C266CFE52081DE341C7EC6752E674',
        },
      ],
      [
        'eth>axelar>wbtc',
        {
          native: 'ibc/05D299885B07905B6886F554B39346EA6761246076A1120B1950049B92B922DD',
        },
      ],
      [
        'neutron>astropepe',
        {
          native: 'ibc/52B30BB501A222D586222700F241EBC8CA97A4A17C9737DDCC00DD0BBC24CEAD',
        },
      ],
    ]),
  }),
  new ContractRegistry(),
  new PoolRegistry()
)

export class Terra2 extends Chain {
  constructor() {
    // super('terra2', [pisco_1])
    super('terra2', [phoenix_1])
    // super('terra2', [phoenix_1, pisco_1])
  }
}
