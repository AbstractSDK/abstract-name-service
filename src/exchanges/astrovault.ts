import { Exchange } from './exchange'
import { Network } from '../networks/network'
import LocalCache from '../helpers/LocalCache'
import { match, P } from 'ts-pattern'
import { NotFoundError } from '../registry/IRegistry'
import { AnsAssetEntry, AnsPoolEntry, AssetInfo, PoolId } from '../objects'
import { PoolType } from '@abstract-os/abstract.js/lib/native/ans-host/AnsHost.types'

const ASTROVAULT = 'astrovault'

interface AstrovaultOptions {
  standardPoolFactoryAddress: string
  stablePoolFactoryAddress: string
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

  // standard pair factory
  async retrieveStandardPairs(network: Network): Promise<PairsItem[]> {
    const queryClient = await network.queryClient()
    const pairsResponse: StandardPairsResponse = await queryClient.queryContractSmart(
      this.options.standardPoolFactoryAddress,
      {
        pairs: {},
      }
    )

    return pairsResponse.pairs
  }

  // stable pool factory
  async retrieveStablePairs(network: Network): Promise<StablePoolItem[]> {
    const queryClient = await network.queryClient()
    const poolsResponse: StablePoolsResponse = await queryClient.queryContractSmart(
      this.options.stablePoolFactoryAddress,
      {
        pools: {},
      }
    )

    return poolsResponse.pools
  }

  async registerAssets(network: Network) {
    const pairs = await this.retrieveStandardPairs(network)
    const pools = await this.retrieveStablePairs(network)
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

  async registerPools(network: Network) {
    const standardPairs = await this.retrieveStandardPairs(network)
    standardPairs.forEach((pair) => {
      this.registerPair(network, 'ConstantProduct', pair)
    })

    const stablePools = await this.retrieveStablePairs(network)
    stablePools.forEach((pair) => {
      this.registerPair(network, 'Stable', pair)
    })
  }

  private registerPair(network: Network, poolType: PoolType, pair: PairsItem): void {
    const poolAddress = pair.contract_addr
    const lpAddress = pair.liquidity_token
    const stakingAddress = pair.lp_staking
    const assetInfos = pair.asset_infos.map((assetInfo) => {
      return match(assetInfo)
        .with({ native_token: { denom: P.select() } }, (denom) => {
          return AssetInfo.native(denom)
        })
        .with({ token: { contract_addr: P.select() } }, (cw20Address) => {
          return AssetInfo.cw20(cw20Address)
        })
        .otherwise((a) => {
          throw new Error(`Unknown asset type ${a}`)
        })
    })
    let assetNames
    try {
      // Use the already-registered asset names
      assetNames = network.assetRegistry.getNamesByInfos(assetInfos)
    } catch (e) {
      if (e instanceof NotFoundError) {
        // TODO
        // if (network.assetRegistry.hasSkipped(token1_address)) {
        //
        // }
      }
      console.error(`Could not resolve assets for pool with addr ${poolAddress}`)
      return
    }

    // register the pool
    const poolMetadata = this.poolMetadata(poolType, assetNames)
    network.poolRegistry.register(new AnsPoolEntry(PoolId.contract(poolAddress), poolMetadata))

    // register the lp token
    const lpTokenName = this.lpTokenName(assetNames)
    network.assetRegistry.register(new AnsAssetEntry(lpTokenName, AssetInfo.from(lpAddress)))

    // register the staking contract
    const stakingContract = this.stakingContractEntry(assetNames, stakingAddress)
    network.contractRegistry.register(stakingContract)
  }

  private poolMetadata(pairType: PoolType, assets: string[]): AbstractPoolMetadata {
    return {
      dex: this.name.toLowerCase(),
      pool_type: pairType,
      assets,
    }
  }
}

interface StandardPairsResponse {
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

interface StablePoolsResponse {
  pools: StablePoolItem[]
}
interface StablePoolItem {
  asset_infos: AssetInfosItem[]
  contract_addr: string
  liquidity_token: string
  lockups: string
  asset_decimals: number[]
  lp_staking: string
  cashback: string | null
}
