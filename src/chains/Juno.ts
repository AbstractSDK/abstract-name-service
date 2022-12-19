import { Chain } from './chain'
import { Juno1 } from '../networks/juno1'
import { Junoswap } from '../exchanges/junoswap'
import { NetworkRegistry } from '../networks/networkRegistry'

const JUNO_1 = new Juno1(new NetworkRegistry(), {
  ibcAssetsUrl:
    'https://raw.githubusercontent.com/CosmosContracts/junoswap-asset-list/main/ibc_assets.json',
})
const JUNOSWAP = new Junoswap({
  poolListUrl: 'https://raw.githubusercontent.com/CosmosContracts/junoswap-asset-list/main/pools_list.json'
})

JUNOSWAP.registerAssets(JUNO_1)

export class Juno extends Chain {
  constructor() {
    super('juno', [
      JUNO_1,
    ])
  }
}

