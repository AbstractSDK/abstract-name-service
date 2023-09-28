import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Pisco1 } from '../networks/pisco1'
import { Phoenix1 } from '../networks/phoenix1'

// const phoenix_1 = new Phoenix1(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())
const pisco_1 = new Pisco1(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())
const phoenix_1 = new Phoenix1(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())

export class Terra2 extends Chain {
  constructor() {
    // super('terra2', [pisco_1])
    super('terra2', [phoenix_1])
    // super('terra2', [phoenix_1, pisco_1])
  }
}
