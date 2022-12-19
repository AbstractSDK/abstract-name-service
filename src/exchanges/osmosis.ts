import { AnsAssetEntry, AnsPoolEntry, PoolId } from '../objects'
import { Exchange } from './exchange'

export class Osmosis extends Exchange {
  constructor() {
    super('Osmosis', 'osmosis')
  }

  readonly networkToPoolList = {
    'osmo-1': 'https://lcd-osmosis.keplr.app/osmosis/gamm/v1beta1/pools?pagination.limit=1000',
  } as const

  readonly networkToVolume = {
    'osmo-1': 'https://api-osmosis.imperator.co/fees/v1/pools',
  }

  private poolListCache: Record<string, OsmosisPoolList> = {}

  private async fetchPoolList(
    network: keyof typeof this.networkToPoolList
  ): Promise<OsmosisPoolList> {
    if (this.poolListCache[network]) {
      return this.poolListCache[network]
    }

    // retrieve all the pools
    const listUrl = this.networkToPoolList[network]
    let poolList: OsmosisPoolList = await fetch(listUrl).then((res) => res.json())

    // retrieve the highest volume pools, to sort the actual pools by volume
    const volumeUrl = this.networkToVolume[network]
    const volumeList: OsmosisPoolVolumeList = await fetch(volumeUrl).then((res) => res.json())

    // sort the pools by volume
    const sortedPools = poolList.pools.sort((a, b) => {
      const aVolume = volumeList.data.find((pool) => pool.pool_id === a.id)?.volume_7d ?? 0
      const bVolume = volumeList.data.find((pool) => pool.pool_id === b.id)?.volume_7d ?? 0
      return bVolume - aVolume
    })

    poolList = {
      ...poolList,
      pools: sortedPools.slice(0, volumeList.data.length),
    }
    this.poolListCache[network] = poolList

    return poolList
  }

  determinePoolType = ({ pool_assets, pool_params, id }: OsmosisPool): PoolType | undefined => {
    if (pool_assets?.length) {
      if (pool_params.smooth_weight_change_params) {
        return 'liquidity_bootstrap'
      }
      const weights = pool_assets.map(({ weight }) => weight)
      if (weights.every((weight) => weight === weights[0])) {
        return 'constant_product'
      }
      return 'weighted'
    }

    console.warn(`Id: ${id} has unknown pool type`, pool_assets, pool_params)
    return undefined
  }

  async retrievePools(network: string): Promise<AnsPoolEntry[]> {
    console.log(`Retrieving pools for ${this.dexName} on ${network}`)
    if (!this.supportsNetwork(network)) {
      return []
    }

    const poolList = await this.fetchPoolList(network as keyof typeof this.networkToPoolList)
    console.log(`Retrieved ${poolList.pools.length} pools for ${this.dexName} on ${network}`)

    const ansPoolEntries: AnsPoolEntry[] = []
    poolList.pools.forEach((pool: OsmosisPool) => {
      const { pool_assets, id } = pool

      const assets = pool_assets?.map(({ token }) => token).map(({ denom }) => denom.toLowerCase())
      if (!assets) return
      const poolType = this.determinePoolType(pool)
      if (!poolType) return

      ansPoolEntries.push(
        new AnsPoolEntry(PoolId.id(+id), {
          dex: this.dexName.toLowerCase(),
          poolType,
          assets,
        })
      )
    })

    return ansPoolEntries
  }

  supportsNetwork = (network: string) => Object.keys(this.networkToPoolList).includes(network)

  async retrieveAssets(network: string): Promise<AnsAssetEntry[]> {
    if (!this.supportsNetwork(network)) {
      return []
    }

    // const poolList = await this.fetchPoolList(network as keyof typeof this.networkToPoolList)
    //
    // const ansAssetEntries: AnsAssetEntry[] = []
    //
    // poolList.pools
    //   .flatMap(({ pool_assets }) => pool_assets)
    //   .forEach(({ native, symbol, token_address, denom }) => {
    //     // only add to ansAssetEntries if it's not already there
    //     const newEntry = new AnsAssetEntry(
    //       symbol,
    //       native ? AssetInfo.native(denom) : AssetInfo.cw20(token_address)
    //     )
    //     if (!ansAssetEntries.some((entry) => entry.equals(newEntry))) {
    //       ansAssetEntries.push(newEntry)
    //     }
    //   })

    return []
  }
}

interface OsmosisPoolList {
  pools: OsmosisPool[]
  pagination: Pagination
}
interface OsmosisPool {
  '@type': string
  address: string
  id: string
  pool_params: Pool_params
  future_pool_governor: string
  total_shares: Total_shares
  pool_assets?: PoolAssetsItem[]
  total_weight?: string
  pool_liquidity?: PoolLiquidityItem[]
  scaling_factors?: string[]
  scaling_factor_controller?: string
}
interface Pool_params {
  swap_fee: string
  exit_fee: string
  smooth_weight_change_params?: null
}
interface Total_shares {
  denom: string
  amount: string
}
interface PoolAssetsItem {
  token: Token
  weight: string
}
interface Token {
  denom: string
  amount: string
}
interface PoolLiquidityItem {
  denom: string
  amount: string
}
interface Pagination {
  next_key: null
  total: string
}

interface OsmosisPoolVolumeList {
  last_update_at: number
  data: PoolVolumeItem[]
}
interface PoolVolumeItem {
  pool_id: string
  volume_24h: number
  volume_7d: number
  fees_spent_24h: number
  fees_spent_7d: number
  fees_percentage: string
}
