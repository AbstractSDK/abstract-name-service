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
      [
        'dydx>dydx',
        {
          native: 'ibc/2CB87BCE0937B1D1DFCEE79BE4501AAF3C265E923509AEAC410AD85D27F35130',
        },
      ],
      [
        'cerberus>osmosis>crbrus',
        {
          native: 'ibc/58923AAE6E879D7CB5FB0F2F05550FD4F696099AB0F5CDF0A05CC0309DD8BC78',
        },
      ],
      [
        'neutron>astropepe',
        {
          native: 'factory/neutron14henrqx9y328fjrdvz6l6d92r0t7g5hk86q5nd/uastropepe',
        },
      ],
      [
        'neutron>goddard',
        {
          native: 'factory/neutron1t5qrjtyryh8gzt800qr5vylhh2f8cmx4wmz9mc/ugoddard',
        },
      ],
    ]),
  }),
  new ContractRegistry(),
  new PoolRegistry()
)

export class Neutron extends Chain {
  constructor() {
    super('neutron', [mainnet])
  }
}
