import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { Juno1 } from '../networks/juno1'
import { AssetRegistry } from '../registry/assetRegistry'
import { Uni6 } from '../networks/uni6'

const mainnet = new Juno1(
  new AssetRegistry({
    assetRegistry: new Map([
      [
        'osmosis>osmo',
        {
          native: 'ibc/ED07A3391A112B175915CD8FAF43A2DA8E4790EDE12566649D0C2F97716B8518',
        },
      ],
      [
        'eth>axelar>weth',
        {
          native: 'ibc/95A45A81521EAFDBEDAEEB6DA975C02E55B414C95AD3CE50709272366A90CA17',
        },
      ],
      [
        'eth>axelar>usdc',
        {
          native: 'ibc/EAC38D55372F38F1AFD68DF7FE9EF762DCF69F26520643CF3F9D292A738D8034',
        },
      ],
      [
        'mars>mars',
        {
          native: 'ibc/281FEE887CDF71EB9C1FEFC554822DCB06BE4E8A8BFF944ED64E3D03437E9384',
        },
      ],
      [
        'stargaze>stars',
        {
          native: 'ibc/F6B367385300865F654E110976B838502504231705BAC0849B0651C226385885',
        },
      ],
    ]),
  }),
  new ContractRegistry(),
  new PoolRegistry(),
  {
    ibcAssetsUrl:
      'https://raw.githubusercontent.com/CosmosContracts/junoswap-asset-list/main/ibc_assets.json',
  }
)

const testnet = new Uni6(
  new AssetRegistry({
    assetRegistry: new Map([
      [
        'juno>junox',
        {
          native: 'ujunox',
        },
      ],
    ]),
  }),
  new ContractRegistry(),
  new PoolRegistry()
)

export class Juno extends Chain {
  constructor() {
    super('juno', [testnet, mainnet])
  }
}
