import { Exchange } from './exchange'
import wretch from 'wretch'
import { match, P } from 'ts-pattern'
import { AnsAssetEntry, AnsPoolEntry, AssetInfo, PoolId } from '../objects'
import { Network } from '../networks/network'
import { NotFoundError } from '../registry/IRegistry'
import { fromAscii, toAscii } from 'cosmwasm'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { Cw20QueryClient } from '@abstract-os/abstract.js'

const WYND_DEX = 'Wyndex'

const WYND_POOL_TYPE: PoolType = 'ConstantProduct'

interface WyndOptions {
  poolListUrl: string
  assetListUrl: string
}

export class Wynd extends Exchange {
  private options: WyndOptions
  private poolListCache: WyndPoolList | undefined

  async fetchPoolList(): Promise<WyndPoolList> {
    if (this.poolListCache) {
      return this.poolListCache
    }

    const poolList: WyndPoolList = await wretch(this.options.poolListUrl).get().json()
    this.poolListCache = poolList
    return poolList
  }

  constructor(options: WyndOptions) {
    super(WYND_DEX)
    this.options = options
  }

  async registerAssets(network: Network) {
    const poolList = await this.fetchPoolList()
    console.log(`Found ${Object.keys(poolList).length} pools on Wynd`)
    const client = await network.queryClient()

    // Register the assets in the wynd pools
    for (const wyndTokenInfos of Object.values(poolList)) {
      for (const info of wyndTokenInfos) {
        try {
          match(info)
            .with({ token: P.select() }, async (token) => {
              let symbol = network.assetRegistry.getByDenom(token)
              if (!symbol) {
                const tokenClient = new Cw20QueryClient(client, token)
                const tokenInfo = await tokenClient.tokenInfo().catch(() => undefined)
                if (!tokenInfo) throw new NotFoundError(`Asset ${token} not found`)
                symbol = tokenInfo.symbol.toLowerCase()
              }
              network.registerLocalAsset(symbol, AssetInfo.cw20(token))
            })
            .with({ native: P.select() }, async (native) => {
              try {
                await network.registerNativeAsset({ denom: native })
              } catch (e) {
                console.warn(
                  `Skipping asset ${JSON.stringify(info)} because of missing asset: ${e}`
                )
              }
            })
            .exhaustive()
        } catch (e) {
          if (e instanceof NotFoundError) {
            console.warn(`Skipping asset ${JSON.stringify(info)} because of missing asset: ${e}`)
            return
          }
          throw e
        }
      }
    }

    // Register the LP tokens for the wynd pools
    for (const [pairAddress, assetInfos] of Object.entries(poolList)) {
      // raw query the pair address for the config
      const config = await this.queryPairConfig(client, pairAddress)
      const {
        pair_info: { liquidity_token: lpTokenAddress },
      } = config

      let assetNames
      try {
        assetNames = this.findRegisteredAssetNames(network, assetInfos)
      } catch (e) {
        if (e instanceof NotFoundError) {
          console.warn(`Skipping lp_token ${lpTokenAddress} because of missing asset: ${e}`)
          continue
        }
        throw e
      }

      const lpTokenSymbol = this.lpTokenName(assetNames)
      const lpTokenEntry = new AnsAssetEntry(lpTokenSymbol, AssetInfo.cw20(lpTokenAddress))
      network.assetRegistry.register(lpTokenEntry)
    }
  }

  async registerPools(network: Network) {
    const poolList = await this.fetchPoolList()

    for (const [address, assetInfos] of Object.entries(poolList)) {
      let assetNames
      try {
        assetNames = this.findRegisteredAssetNames(network, assetInfos)
      } catch (e) {
        if (e instanceof NotFoundError) {
          console.warn(`Skipping pool ${address} because of missing asset: ${e}`)
          continue
        }
        throw e
      }

      network.poolRegistry.register(
        new AnsPoolEntry(PoolId.contract(address), this.buildPoolMetadata(assetNames))
      )
    }
  }

  async registerContracts(network: Network) {
    const poolList = await this.fetchPoolList()
    const client = await network.queryClient()
    for (const [address, assetInfos] of Object.entries(poolList)) {
      // raw query the pair address for the config
      const config = await this.queryPairConfig(client, address)

      if (!config) {
        console.warn(`Skipping pool ${address} because of missing config`)
        continue
      }

      // transform the addresses into asset names
      let assetNames
      try {
        assetNames = this.findRegisteredAssetNames(network, assetInfos)
      } catch (e) {
        if (e instanceof NotFoundError) {
          console.warn(`Skipping pool ${address} because of missing asset: ${e}`)
          continue
        }
        throw e
      }

      const {
        pair_info: { staking_addr },
      } = config

      const newEntry = this.stakingContractEntry(assetNames, staking_addr)
      network.contractRegistry.register(newEntry)
    }
  }

  /**
   * Query the pair config from the contract.
   * @param client
   * @param address
   * @private
   */
  private async queryPairConfig(client: CosmWasmClient, address: string): Promise<WyndPairConfig> {
    const config = await client
      .queryContractRaw(address, toAscii('config'))
      .then((response): WyndPairConfig => (response ? JSON.parse(fromAscii(response)) : response))
    return config
  }

  private tokenDenomFromAssetInfo(info: WyndAssetInfo): string {
    return match(info)
      .with({ token: P.select() }, (token) => token)
      .with({ native: P.select() }, (native) => native)
      .exhaustive()
  }

  private findRegisteredAssetNames(network: Network, infos: WyndAssetInfo[]): string[] {
    return infos.map((info) => {
      const tokenDenom = this.tokenDenomFromAssetInfo(info)
      const name = network.assetRegistry.getByDenom(tokenDenom)
      if (!name) {
        throw new NotFoundError(`Asset ${tokenDenom} not found in registry`)
      }
      return name
    })
  }

  private buildPoolMetadata(assetNames: string[]): AbstractPoolMetadata {
    return {
      dex: this.name.toLowerCase(),
      pool_type: WYND_POOL_TYPE,
      assets: assetNames,
    }
  }
}

interface Cw20WyndAssetInfo {
  token: string
  amount: string
}

interface NativeWyndAssetInfo {
  native: string
  amount: string
}

type WyndAssetInfo = Cw20WyndAssetInfo | NativeWyndAssetInfo

type WyndPoolList = Record<string, WyndAssetInfo[]>

interface WyndPairConfig {
  pair_info: Pair_info
  factory_addr: string
  block_time_last: number
  price0_cumulative_last: string
  price1_cumulative_last: string
  trading_starts: number
}

interface Pair_info {
  asset_infos: unknown[]
  contract_addr: string
  liquidity_token: string
  staking_addr: string
  pair_type: unknown
  fee_config: Fee_config
}

interface Fee_config {
  total_fee_bps: number
  protocol_fee_bps: number
}
