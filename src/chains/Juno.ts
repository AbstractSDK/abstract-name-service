import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { Juno1 } from '../networks/juno1'
import { AssetRegistry } from '../registry/assetRegistry'
import { Uni5 } from '../networks/uni5'

const juno_1 = new Juno1(new AssetRegistry(), new ContractRegistry(), new PoolRegistry(), {
  ibcAssetsUrl:
    'https://raw.githubusercontent.com/CosmosContracts/junoswap-asset-list/main/ibc_assets.json',
})

const uni_5 = new Uni5(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())

export class Juno extends Chain {
  constructor() {
    super('juno', [uni_5])
    // super('juno', [juno_1, uni_5])
  }
}
