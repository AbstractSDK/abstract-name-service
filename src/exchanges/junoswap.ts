import { AnsAssetEntry, AnsContractEntry, AnsPoolEntry, AssetInfo, PoolId } from '../objects'
import { Exchange } from './exchange'

const JUNOSWAP_POOL_TYPE: PoolType = 'constant_product'

export class Junoswap extends Exchange {
  constructor() {
    super('Junoswap', 'juno')
  }

  private networkToPoolList = {
    'juno-1':
      'https://raw.githubusercontent.com/CosmosContracts/junoswap-asset-list/main/pools_list.json',
    'uni-5': 'https://wasmswap.io/pools_list.testnet.json',
  } as const

  supportsNetwork = (network: string) => Object.keys(this.networkToPoolList).includes(network)
  private poolListCache: Record<string, JunoswapPoolList> = {}

  private async fetchPoolList(
    network: keyof typeof this.networkToPoolList
  ): Promise<JunoswapPoolList> {
    if (this.poolListCache[network]) {
      return this.poolListCache[network]
    }

    const listUrl = this.networkToPoolList[network]
    const poolList = await fetch(listUrl).then((res) => res.json())
    this.poolListCache[network] = poolList
    return poolList
  }

  async retrievePools(network: string): Promise<AnsPoolEntry[]> {
    if (!this.supportsNetwork(network)) {
      return []
    }

    const poolList = await this.fetchPoolList(network as keyof typeof this.networkToPoolList)

    const ansPoolEntries = poolList.pools.map(({ pool_assets, swap_address }: PoolsItem) => {
      return new AnsPoolEntry(PoolId.contract(swap_address), {
        dex: this.name.toLowerCase(),
        poolType: JUNOSWAP_POOL_TYPE,
        assets: pool_assets.map(({ symbol }) => symbol.toLowerCase()),
      })
    })

    return ansPoolEntries
  }

  async retrieveAssets(network: string): Promise<AnsAssetEntry[]> {
    if (!this.supportsNetwork(network)) {
      return []
    }

    const poolList = await this.fetchPoolList(network as keyof typeof this.networkToPoolList)

    const ansAssetEntries: AnsAssetEntry[] = []

    poolList.pools
      .flatMap(({ pool_assets }) => pool_assets)
      .forEach(({ native, symbol, token_address, denom }) => {
        // only add to ansAssetEntries if it's not already there
        const newEntry = new AnsAssetEntry(
          symbol,
          native ? AssetInfo.native(denom) : AssetInfo.cw20(token_address)
        )
        if (!ansAssetEntries.some((entry) => entry.equals(newEntry))) {
          ansAssetEntries.push(newEntry)
        }
      })

    return ansAssetEntries
  }

  async retrieveContracts(network: string): Promise<AnsContractEntry[]> {
    if (!this.supportsNetwork(network)) {
      return []
    }

    const poolList = await this.fetchPoolList(network as keyof typeof this.networkToPoolList)

    const ansContractEntries: AnsContractEntry[] = []

    poolList.pools.forEach(({ staking_address, pool_assets }) => {
      if (!staking_address) return

      const contractName = this.stakingContractName(pool_assets)

      const newEntry = new AnsContractEntry(this.name.toLowerCase(), contractName, staking_address)
      if (!ansContractEntries.some((entry) => entry.equals(newEntry))) {
        ansContractEntries.push(newEntry)
      }
    })

    return ansContractEntries
  }

  private stakingContractName(pool_assets: PoolAssetsItem[]) {
    return pool_assets.map(({ symbol }) => symbol.toLowerCase()).join(',')
  }
}

interface JunoswapPoolList {
  name: string
  base_token: Base_token
  logoURI: string
  keywords: string[]
  tags: Tags
  timestamp: string
  pools: PoolsItem[]
  version: Version
}

interface Base_token {
  id: string
  chain_id: string
  token_address: string
  symbol: string
  name: string
  decimals: number
  logoURI: string
  tags: string[]
  native: boolean
  denom: string
}

interface Tags {
  Juno: Juno
}

interface Juno {
  name: string
  description: string
}

interface PoolsItem {
  pool_id: string
  pool_assets: PoolAssetsItem[]
  swap_address: string
  staking_address: string
  rewards_tokens: RewardsTokensItem[]
}

interface PoolAssetsItem {
  id: string
  chain_id: string
  token_address: string
  symbol: string
  name: string
  decimals: number | string
  logoURI: string
  tags: string[]
  native: boolean
  denom: string
}

interface RewardsTokensItem {
  rewards_address: string
  token_address: string
  swap_address: string
  symbol: string
  name: string
  logoURI: string
  native: boolean
  denom: string
  decimals: number
}

interface Version {
  major: number
  minor: number
  patch: number
}
