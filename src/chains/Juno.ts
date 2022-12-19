import { Chain } from './chain'
import { Juno1 } from '../networks/juno1'
import { Junoswap } from '../exchanges/junoswap'

const JUNO_1 = new Juno1({
  ibcAssetsUrl:
    'https://raw.githubusercontent.com/CosmosContracts/junoswap-asset-list/main/ibc_assets.json',
})

const UNI_5 = new


export class Juno extends Chain {
  constructor() {
    super('juno', [
      JUNO_1,
    ])
  }
}

