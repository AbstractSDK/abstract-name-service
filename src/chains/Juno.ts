import { Chain } from './chain'
import { Juno1 } from '../networks/juno1'
import { Junoswap } from '../exchanges/junoswap'
import { NetworkRegistry } from '../networks/networkRegistry'
import { Uni5 } from '../networks/uni5'

const juno_1 = new Juno1(new NetworkRegistry(), {
  ibcAssetsUrl:
    'https://raw.githubusercontent.com/CosmosContracts/junoswap-asset-list/main/ibc_assets.json',
})

const uni_5 = new Uni5(new NetworkRegistry())

export class Juno extends Chain {
  constructor() {
    super('juno', [uni_5])
    // super('juno', [juno_1, uni_5])
  }
}

