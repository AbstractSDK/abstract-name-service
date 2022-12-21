import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { Juno1 } from '../networks/juno1'
import { AssetRegistry } from '../registry/assetRegistry'
import { Uni5 } from '../networks/uni5'
import { Phoenix1 } from '../networks/phoenix1'

const phoenix_1 = new Phoenix1(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())

export class Terra extends Chain {
  constructor() {
    super('terra2', [phoenix_1])
  }
}
