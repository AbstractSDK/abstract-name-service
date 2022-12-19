import { AnsAssetEntry, AnsContractEntry, AnsPoolEntry, AssetInfo, PoolId } from '../objects'
import { Exchange } from './exchange'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { chains } from 'chain-registry'
import { AnsName } from '../objects/AnsName'
import { Network } from '../chains/network'

const JUNOSWAP_POOL_TYPE: PoolType = 'constant_product'

const WASMSWAP_INFO_QUERY = { info: {} }

type Denom = string

interface JunoswapOptions {
  poolListUrl: string
}

const JUNOSWAP = 'Junoswap'

export class Junoswap extends Exchange {
  private options: JunoswapOptions

  constructor(network: Network, options: JunoswapOptions) {
    super(JUNOSWAP, network)
    this.options = options
  }

  private poolListCache: JunoswapPoolList | undefined

  private async fetchPoolList(): Promise<JunoswapPoolList> {
    if (this.poolListCache) {
      return this.poolListCache
    }

    const listUrl = this.options.poolListUrl
    const poolList = await fetch(listUrl).then((res) => res.json())
    this.poolListCache = poolList
    return poolList
  }

  async retrievePools(network: string): Promise<AnsPoolEntry[]> {
    const poolList = await this.fetchPoolList()

    const ansPoolEntries = poolList.pools.map(({ pool_assets, swap_address }: JunoswapPool) => {
      return new AnsPoolEntry(PoolId.contract(swap_address), this.buildPoolMetadata(pool_assets))
    })

    return ansPoolEntries
  }

  private buildPoolMetadata(pool_assets: JunoswapPoolAsset[]): AbstractPoolMetadata {
    return {
      dex: this.dexName.toLowerCase(),
      poolType: JUNOSWAP_POOL_TYPE,
      assets: pool_assets.map(({ symbol }) => symbol.toLowerCase()),
    }
  }

  private resolvedAssets: Record<string, Map<Denom, AnsAssetEntry[]>> = {}

  async retrieveAssets(networkId: string): Promise<AnsAssetEntry[]> {
    const { pools } = await this.fetchPoolList()
    console.log(`Found ${pools.length} pools on Junoswap`)

    // List of assets in all the junoswap pools
    const uncheckedJunoswapAssets: JunoswapPoolAsset[] = pools.flatMap(
      ({ pool_assets }) => pool_assets
    )

    // add assets for pools
    for (const { symbol, token_address, denom, native } of uncheckedJunoswapAssets) {
      if (native) {
        // if it's a native asset, we check if its registered already. If not registered, it is not a preknown asset, so we generate a new entry
        await this.chain.registerNativeAsset({
          denom,
          symbol,
        })
      } else {
        const cw20AssetEntry = new AnsAssetEntry(symbol, AssetInfo.cw20(token_address))
        this.chain.registerAsset(cw20AssetEntry)
      }
    }

    // add LP tokens for pools
    for (const { pool_assets, swap_address } of pools) {
      // For example, lp/atom,osmo,
      const lpTokenSymbol = this.lpTokenName(this.extractAssetSymbols(pool_assets))
      const lpTokenAddress = await this.queryLpTokenAddress(swap_address)

      const lpTokenEntry = new AnsAssetEntry(lpTokenSymbol, AssetInfo.cw20(lpTokenAddress))

      this.chain.registerAsset(lpTokenEntry)
    }

    return []
  }

  async retrieveContracts(networkId: string): Promise<AnsContractEntry[]> {
    const poolList = await this.fetchPoolList()

    const ansContractEntries: AnsContractEntry[] = []

    poolList.pools.forEach(({ staking_address, pool_assets }) => {
      if (!staking_address) return

      const contractName = AnsName.stakingContract(this.extractAssetSymbols(pool_assets))

      const newEntry = new AnsContractEntry(
        this.dexName.toLowerCase(),
        contractName,
        staking_address
      )
      if (!ansContractEntries.some((entry) => entry.equals(newEntry))) {
        ansContractEntries.push(newEntry)
      }
    })

    return ansContractEntries
  }

  private async queryLpTokenAddress(poolAddress: string) {
    const client = await this.chain.queryClient()
    const poolInfo: WasmSwapContractInfo = await client.queryContractSmart(
      poolAddress,
      WASMSWAP_INFO_QUERY
    )
    if (!poolInfo.lp_token_address) throw new Error(`No LP token found for pool ${poolAddress}`)
    return poolInfo.lp_token_address
  }

  private extractAssetSymbols(junoswapPoolAssets: JunoswapPoolAsset[]): string[] {
    return junoswapPoolAssets.map(({ token_address, native, denom }) => {
      const searchBy = native ? denom : token_address
      const registeredSymbol = this.chain.getRegisteredSymbolByAddress(searchBy)
      if (!registeredSymbol) {
        throw new Error(`No registered asset found for ${searchBy}`)
      }
      return registeredSymbol
    })
  }
}

interface JunoswapPoolList {
  name: string
  base_token: Base_token
  logoURI: string
  keywords: string[]
  tags: unknown
  timestamp: string
  pools: JunoswapPool[]
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

interface JunoswapPool {
  pool_id: string
  pool_assets: JunoswapPoolAsset[]
  swap_address: string
  staking_address: string
  rewards_tokens: RewardsTokensItem[]
}

interface JunoswapPoolAsset {
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

interface WasmSwapContractInfo {
  token1_reserve: string
  token1_denom: CwAssetInfo
  token2_reserve: string
  token2_denom: CwAssetInfo
  lp_token_supply: string
  lp_token_address: string
}
