import { Network } from './network'
import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Wynd } from '../exchanges/wynd'

const JUNO_1 = 'juno-1'

interface Juno1Options {
  ibcAssetsUrl: string
}

export class Juno1 extends Network {
  options: Juno1Options

  constructor(
    assetRegistry: AssetRegistry,
    contractRegistry: ContractRegistry,
    poolRegistry: PoolRegistry,
    options: Juno1Options
  ) {
    super({
      networkId: JUNO_1,
      assetRegistry,
      contractRegistry,
      poolRegistry,
      exchanges: [
        // new Junoswap({
        //   poolListUrl:
        //     'https://raw.githubusercontent.com/CosmosContracts/junoswap-asset-list/main/pools_list.json',
        // }),
        new Wynd({
          poolListUrl: 'https://api.wynddao.com/pools',
          assetListUrl: 'https://api.wynddao.com/assets',
        }),
      ],
    })
    this.options = options
  }
}
