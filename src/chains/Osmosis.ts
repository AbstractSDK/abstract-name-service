import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Osmosis1 } from '../networks/osmosis1'
import { OsmoTest5 } from '../networks/osmotest5'

const mainnet = new Osmosis1(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())
const testnet = new OsmoTest5(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())

export class Osmosis extends Chain {
  constructor() {
    super('osmosis', [mainnet, testnet])
  }
}
