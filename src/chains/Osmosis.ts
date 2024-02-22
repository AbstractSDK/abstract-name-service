import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Osmosis1 } from '../networks/osmosis1'
import { OsmoTest5 } from '../networks/osmotest5'
import { AnsContractEntry } from '../objects'

/*
https://github.com/cosmostation/chainlist/blob/d433b3b8b7a0699ac137be1775b67fa00393de05/chain/osmosis/assets.json#L1255
https://github.com/osmosis-labs/osmosis/blob/f11259d75d53a9e7ebeec03b163bd533f5cc90df/cmd/osmosisd/cmd/osmosis-1-assetlist.json#L6873
 */
const mainnet = new Osmosis1(
  new AssetRegistry({
    assetRegistry: new Map([
      [
        'celestia>tia',
        {
          native: 'ibc/D79E7D83AB399BFFF93433E54FAA480C191248FC556924A2A8351AE2638B3877',
        },
      ],
      [
        'terraclassic>ust',
        {
          native: 'ibc/BE1BB42D4BE3C30D50B68D7C41DB4DFCE9678E8EF8C539F6E6A9345048894FCC',
        },
      ],
      [
        'terraclassic>luna',
        {
          native: 'ibc/0EF15DF2F02480ADE0BB6E85D9EBB5DAEA2836D3860E9F97F9AADE4F57A31AA0',
        },
      ],
      [
        'eth>axelar>wbtc',
        {
          native: 'ibc/D1542AA8762DB13087D8364F3EA6509FD6F009A34F00426AF9E4F9FA85CBBF1F',
        },
      ],
      [
        'noble>usdc',
        {
          native: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
        },
      ],
      [
        'kava>usdt',
        {
          native: 'ibc/4ABBEF4C8926DDDB320AE5188CFD63267ABBCEFC0583E4AE05D6E5AA2401DDAB',
        },
      ],
      [
        'eth>axelar>usdc',
        {
          native: 'ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858',
        },
      ],
      [
        'polygon>axelar>wmatic',
        {
          native: 'ibc/AB589511ED0DD5FA56171A39978AFBF1371DB986EC1C3526CE138A16377E39BB',
        },
      ],
      [
        'eth>axelar>usdt',
        {
          native: 'ibc/8242AD24008032E457D2E12D46588FD39FB54FB29680C6C7663D296B383C37C4',
        },
      ],
      [
        'moonbeam>axelar>dot',
        {
          native: 'ibc/3FF92D26B407FD61AE95D975712A7C319CDE28DE4D80BDC9978D935932B991D7',
        },
      ],
      [
        'arbitrum>axelar>arb',
        {
          native: 'ibc/10E5E5B06D78FFBB61FD9F89209DEE5FD4446ED0550CBB8E3747DA79E10D9DC6',
        },
      ],
      [
        'binancesmartchain>axelar>wbnb',
        {
          native: 'ibc/F4A070A6D78496D53127EA85C094A9EC87DFC1F36071B8CCDDBD020F933D213D',
        },
      ],
      [
        'fantom>axelar>wftm',
        {
          native: 'ibc/5E2DFDF1734137302129EA1C1BA21A580F96F778D4F021815EA4F6DB378DA1A4',
        },
      ],
      [
        'eth>axelar>link',
        {
          native: 'ibc/D3327A763C23F01EC43D1F0DB3CEFEC390C362569B6FD191F40A5192F8960049',
        },
      ],
      [
        'eth>axelar>dai',
        {
          native: 'ibc/0CD3A0285E1341859B5E86B6AB7682F023D03E97607CCC1DC95706411D866DF7',
        },
      ],
      [
        'eth>axelar>weth',
        {
          native: 'ibc/EA1D43981D5C9A1C4AAEA9C23BB1D4FA126BA9BC7020A25E0AE4AA841EA25DC5',
        },
      ],
      [
        'eth>axelar>frax',
        {
          native: 'ibc/0E43EDE2E2A3AFA36D0CD38BDDC0B49FECA64FA426A82E102F304E430ECF46EE',
        },
      ],
      [
        'avalanche>axelar>wavax',
        {
          native: 'ibc/6F62F01D913E3FFE472A38C78235B8F021B511BC6596ADFF02615C8F83D3B373',
        },
      ],
      [
        'eth>gravitybridge>persistence>pstake',
        {
          native: 'ibc/8061A06D3BD4D52C4A28FFECF7150D370393AF0BA661C3776C54FF32836C3961',
        },
      ],
      [
        'eth>gravitybridge>weth',
        {
          native: 'ibc/65381C5F3FD21442283D56925E62EA524DED8B6927F0FF94E21E0020954C40B5',
        },
      ],
      [
        'osmosis>milktia',
        {
          native:
            'factory/osmo1f5vfcph2dvfeqcqkhetwv75fda69z7e5c2dldm3kvgj23crkv6wqcn47a0/umilkTIA',
        },
      ],
      [
        'osmosis>mbrn',
        {
          native: 'factory/osmo1s794h9rxggytja3a4pmwul53u98k06zy2qtrdvjnfuxruh7s8yjs6cyxgd/umbrn',
        },
      ],
      [
        'osmosis>cdt',
        {
          native: 'factory/osmo1s794h9rxggytja3a4pmwul53u98k06zy2qtrdvjnfuxruh7s8yjs6cyxgd/ucdt',
        },
      ],
      [
        'dymension>dym',
        {
          native: 'ibc/9A76CDF0CBCEF37923F32518FA15E5DC92B9F56128292BC4D63C4AEA76CBB110',
        },
      ],
      [
        'stride>sttia',
        {
          native: 'ibc/698350B8A61D575025F3ED13E9AC9C0F45C89DEFE92F76D5838F1D3C1A7FF7C9',
        },
      ],
      [
        'agoric>ist',
        {
          native: 'ibc/92BE0717F4678905E53F4E45B2DED18BC0CB97BF1F8B6A25AFEDF3D5A879B4D5',
        },
      ],
    ]),
  }),
  new ContractRegistry(),
  new PoolRegistry()
)
const testnet = new OsmoTest5(
  new AssetRegistry(),
  new ContractRegistry({
    contractRegistry: [
      new AnsContractEntry(
        'croncat',
        'factory',
        'osmo105qu7ajcf9y5wgpj7kcqj2rmj6zn6d9ernw99efua7834xprvwkq3hfhaz'
      ),
    ],
  }),
  new PoolRegistry()
)

export class Osmosis extends Chain {
  constructor() {
    super('osmosis', [
      mainnet,
      // testnet,
    ])
  }
}
