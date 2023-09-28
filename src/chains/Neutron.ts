import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Pion1 } from '../networks/pion1'
import { Neutron1 } from '../networks/neutron1'

const testnet = new Pion1(
  new AssetRegistry({
    assetRegistry: new Map([
      [
        'eth>axelar>weth',
        {
          native: 'ibc/CC8B40E3F3536D003C6ED7C65421067215453AECE1517A6F0935470C634A036B',
        },
      ],
    ]),
  }),
  new ContractRegistry(),
  new PoolRegistry()
)
const mainnet = new Neutron1(
  new AssetRegistry({
    assetRegistry: new Map([
      [
        'eth>axelar>usdc',
        {
          native: 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349',
        },
      ],
    ]),
  }),
  new ContractRegistry(),
  new PoolRegistry()
)

export class Neutron extends Chain {
  constructor() {
    super('neutron', [testnet, mainnet])
  }
}
