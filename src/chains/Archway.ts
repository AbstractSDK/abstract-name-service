import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Archway1 } from '../networks/archway1'

// https://gist.github.com/7Two1/2a818845794d4cbb293180f96dcf9678
const archway_1 = new Archway1(
  new AssetRegistry({
    assetRegistry: new Map([
      [
        'eth>axelar>usdc',
        {
          native: 'ibc/B9E4FD154C92D3A23BEA029906C4C5FF2FE74CB7E3A058290B77197A263CF88B',
        },
      ],
      [
        'jackal>jkl',
        {
          native: 'ibc/926432AE1C5FA4F857B36D970BE7774C7472079506820B857B75C5DE041DD7A3',
        },
      ],
      [
        'archway>xjkl',
        {
          cw20: 'archway1yjdgfut7jkq5xwzyp6p5hs7hdkmszn34zkhun6mglu3falq3yh8sdkaj7j',
        },
      ],
      [
        'axelar>axl',
        {
          native: 'ibc/E21808AEBCB7E02F594897100186C126E3BC9A36B0974196AF116750A4573F06',
        },
      ],
      [
        'archway>xaxl',
        {
          cw20: 'archway135pmrdfsu8le852q5xztwdlxpmzqrp2t589lrqtw2athnr70wgcqg26ecc',
        },
      ],
    ]),
  }),
  new ContractRegistry(),
  new PoolRegistry()
)

export class Archway extends Chain {
  constructor() {
    super('archway', [archway_1])
  }
}
