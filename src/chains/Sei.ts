import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Pacific1 } from '../networks/pacific1'
import { Atlantic2 } from '../networks/atlantic2'

const mainnet = new Pacific1(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())
const testnet = new Atlantic2(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())

export class Sei extends Chain {
  constructor() {
    super('sei', [mainnet, testnet])
  }
}
