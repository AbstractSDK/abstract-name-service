import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Injective888 } from '../networks/injective888'
import { Injective1 } from '../networks/injective1'

const testnet = new Injective888(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())
const mainnet = new Injective1(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())

export class Injective extends Chain {
  constructor() {
    super('injective', [testnet, mainnet])
  }
}
