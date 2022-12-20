import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { Network } from './network'
import { Osmosis } from '../exchanges'
import { AssetRegistry } from '../registry/assetRegistry'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Osmo1Options {}

const CHAIN_ID = 'osmo-1'

export class Osmo1 extends Network {
  private options: Osmo1Options

  constructor(
    assetRegistry: AssetRegistry,
    contractRegistry: ContractRegistry,
    poolRegistry: PoolRegistry,
    options: Osmo1Options = {}
  ) {
    super({
      networkId: CHAIN_ID,
      assetRegistry: assetRegistry,
      contractRegistry: contractRegistry,
      poolRegistry: poolRegistry,
      exchanges: [
        new Osmosis({
          poolUrl: 'https://lcd-osmosis.keplr.app/osmosis/gamm/v1beta1/pools?pagination.limit=1000',
          volumeUrl: 'https://api-osmosis.imperator.co/fees/v1/pools',
        }),
      ],
    })
    this.options = options
  }
}
