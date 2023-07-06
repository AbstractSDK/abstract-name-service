import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Osmosis1 } from '../networks/osmosis1'
import { OsmoTest5 } from '../networks/osmotest5'

const osmosis1 = new Osmosis1(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())
const osmoTest5 = new OsmoTest5(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())

export class Osmosis extends Chain {
  constructor() {
    super('osmosis', [osmosis1, osmoTest5])
  }
}
