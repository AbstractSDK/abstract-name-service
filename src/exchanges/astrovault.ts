import { Exchange } from './exchange'
import { Network } from '../networks/network'
import LocalCache from '../helpers/LocalCache'
import { match, P } from 'ts-pattern'

const ASTROVAULT = 'astrovault'

interface AstrovaultOptions {
  pairFactoryAddress: string
  poolFactoryAddress: string
  cacheSuffix: string
}

export class Astrovault extends Exchange {
  private options: AstrovaultOptions
  private localCache: LocalCache

  constructor(options: AstrovaultOptions) {
    super(ASTROVAULT)
    this.options = options
    this.localCache = new LocalCache(`${ASTROVAULT}-${options.cacheSuffix}`)
  }

  async retrievePairs(network: Network): Promise<PairsItem[]> {
    const queryClient = await network.queryClient()
    const pairsResponse: PairsResponse = await queryClient.queryContractSmart(
      this.options.pairFactoryAddress,
      {
        pairs: {},
      }
    )

    return pairsResponse.pairs
  }

  async retrievePools(network: Network): Promise<PoolsItem[]> {
    const queryClient = await network.queryClient()
    const poolsResponse: PoolsResponse = await queryClient.queryContractSmart(
      this.options.poolFactoryAddress,
      {
        pools: {},
      }
    )

    return poolsResponse.pools
  }

  async registerAssets(network: Network) {
    const pairs = await this.retrievePairs(network)
    const pools = await this.retrievePools(network)
    for (const pair of [...pairs, ...pools]) {
      for (const assetInfo of pair.asset_infos) {
        await match(assetInfo)
          .with({ native_token: { denom: P.select() } }, async (denom) => {
            await network.registerNativeAsset({ denom })
          })
          .with({ token: { contract_addr: P.select() } }, async (cw20Address) => {
            await network.registerCw20Asset(cw20Address)
          })
          .otherwise((a) => {
            throw new Error(`Unknown asset type ${a}`)
          })
      }
    }
  }

  registerPools(network: Network): void {}
}

interface PairsResponse {
  pairs: PairsItem[]
}
interface PairsItem {
  asset_infos: AssetInfosItem[]
  contract_addr: string
  liquidity_token: string
  asset_decimals: number[]
  lp_staking: string
  cashback: string | null
}
interface AssetInfosItem {
  token?: Token
  native_token?: Native_token
}
interface Token {
  contract_addr: string
}
interface Native_token {
  denom: string
}

interface PoolsResponse {
  pools: PoolsItem[]
}
interface PoolsItem {
  asset_infos: AssetInfosItem[]
  contract_addr: string
  liquidity_token: string
  lockups: string
  asset_decimals: number[]
  lp_staking: string
  cashback: string | null
}
