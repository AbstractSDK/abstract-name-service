import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { Network } from './network'
import { OsmosisDex } from '../exchanges'
import { AssetRegistry } from '../registry/assetRegistry'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Osmosis1Options {}

const CHAIN_ID = 'osmosis-1'

export class Osmosis1 extends Network {
  private options: Osmosis1Options

  constructor(
    assetRegistry: AssetRegistry,
    contractRegistry: ContractRegistry,
    poolRegistry: PoolRegistry,
    options: Osmosis1Options = {}
  ) {
    super({
      networkId: CHAIN_ID,
      assetRegistry: assetRegistry,
      contractRegistry: contractRegistry,
      poolRegistry: poolRegistry,
      exchanges: [
        new OsmosisDex({
          poolUrl: 'https://lcd-osmosis.keplr.app/osmosis/gamm/v1beta1/pools?pagination.limit=1500',
          volumeUrl: 'https://api-osmosis.imperator.co/fees/v1/pools',
        }),
      ],
    })
    this.options = options
  }
}
