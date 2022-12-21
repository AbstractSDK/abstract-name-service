import { AnsAssetEntry, AnsContractEntry, AnsPoolEntry, AssetInfo, PoolId } from '../objects'
import { Exchange } from './exchange'
import { AnsName } from '../objects/AnsName'
import { Network } from '../networks/network'

const JUNOSWAP_POOL_TYPE: PoolType = 'ConstantProduct'

const WASMSWAP_INFO_QUERY = { info: {} }

interface JunoswapOptions {
  poolListUrl: string
}

const JUNOSWAP = 'Junoswap'

/**
 * Junoswap scraper.
 */
export class Junoswap extends Exchange {
  private options: JunoswapOptions
  private poolListCache: JunoswapPoolList | undefined

  constructor(options: JunoswapOptions) {
    super(JUNOSWAP)
    this.options = options
  }

  async registerPools(network: Network) {
    const poolList = await this.fetchPoolList()

    poolList.pools.forEach(({ pool_assets, swap_address }: JunoswapPool) => {
      network.poolRegistry.register(
        new AnsPoolEntry(
          PoolId.contract(swap_address),
          this.buildPoolMetadata(network, pool_assets)
        )
      )
    })
  }

  async registerAssets(network: Network) {
    const { pools } = await this.fetchPoolList()
    console.log(`Found ${pools.length} pools on Junoswap`)

    // List of assets in all the junoswap pools
    const uncheckedJunoswapAssets: JunoswapPoolAsset[] = pools.flatMap(
      ({ pool_assets }) => pool_assets
    )

    // add assets for pools
    for (const { symbol, token_address, denom, native } of uncheckedJunoswapAssets) {
      if (native) {
        await network.registerNativeAsset({
          denom,
          symbol,
        })
      } else {
        const cw20AssetEntry = new AnsAssetEntry(symbol, AssetInfo.cw20(token_address))
        network.assetRegistry.register(cw20AssetEntry)
      }
    }

    // add LP tokens for pools
    for (const { pool_assets, swap_address } of pools) {
      // For example, lp/atom,osmo,
      const lpTokenSymbol = this.lpTokenName(this.findRegisteredAssetSymbols(network, pool_assets))
      const lpTokenAddress = await this.queryLpTokenAddress(network, swap_address)

      const lpTokenEntry = new AnsAssetEntry(lpTokenSymbol, AssetInfo.cw20(lpTokenAddress))

      network.assetRegistry.register(lpTokenEntry)
    }
  }

  async registerContracts(network: Network) {
    const poolList = await this.fetchPoolList()

    poolList.pools
      .filter(({ staking_address }) => staking_address)
      .forEach(({ staking_address, pool_assets }) => {
        const contractName = AnsName.stakingContract(
          this.findRegisteredAssetSymbols(network, pool_assets)
        )

        const newEntry = new AnsContractEntry(
          this.name.toLowerCase(),
          contractName,
          staking_address
        )
        network.contractRegistry.register(newEntry)
      })

    return []
  }

  private async fetchPoolList(): Promise<JunoswapPoolList> {
    if (this.poolListCache) {
      return this.poolListCache
    }

    const listUrl = this.options.poolListUrl
    const poolList = await fetch(listUrl).then((res) => res.json())
    this.poolListCache = poolList
    return poolList
  }

  private buildPoolMetadata(
    network: Network,
    pool_assets: JunoswapPoolAsset[]
  ): AbstractPoolMetadata {
    return {
      dex: this.name.toLowerCase(),
      pool_type: JUNOSWAP_POOL_TYPE,
      assets: this.findRegisteredAssetSymbols(network, pool_assets),
    }
  }

  private async queryLpTokenAddress(network: Network, poolAddress: string) {
    const client = await network.queryClient()
    const poolInfo: WasmSwapContractInfo = await client.queryContractSmart(
      poolAddress,
      WASMSWAP_INFO_QUERY
    )
    if (!poolInfo.lp_token_address) throw new Error(`No LP token found for pool ${poolAddress}`)
    return poolInfo.lp_token_address
  }

  private findRegisteredAssetSymbols(
    network: Network,
    junoswapPoolAssets: JunoswapPoolAsset[]
  ): string[] {
    return junoswapPoolAssets.map(({ token_address, native, denom, symbol }) => {
      const searchBy = native ? denom : token_address
      const registeredSymbol = network.getRegisteredSymbolByAddress(searchBy)
      if (!registeredSymbol) {
        throw new Error(`No registered asset found for ${searchBy} ${symbol}`)
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
