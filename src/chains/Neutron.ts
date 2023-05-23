import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Pion1 } from '../networks/pion1'

const pion_1 = new Pion1(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())

export class Neutron extends Chain {
  constructor() {
    super('neutron', [pion_1])
  }
}
