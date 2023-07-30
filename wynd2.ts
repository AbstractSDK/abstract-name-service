import { Exchange } from './exchange'
import { AnsAssetEntry, AnsPoolEntry, AssetInfo, PoolId } from '../objects'
import { NotFoundError } from '../registry/IRegistry'
import { Network } from '../networks/network'
import { match, P } from 'ts-pattern'
import { WyndexFactoryQueryClient } from '../clients/wyndex/WyndexFactory.client'
import {
  AssetInfo as WyndexAssetInfo,
  PairInfo,
  PairsResponse,
  PairType,
} from '../clients/wyndex/WyndexFactory.types'
import LocalCache from '../helpers/LocalCache'
import { WyndexPairQueryClient } from '../clients/wyndex/WyndexPair.client'

const WYND = 'Wyndex'

interface WyndexOptions {
  // queryUrl: string
  factoryAddress: string
  cacheSuffix: string
}

const ALL_PAIRS_CACHE_KEY = 'allPairs'
const TOP_PAIRS_CACHE_KEY = 'topPairs'

const TOP_PAIR_COUNT = 50

/**
 * Wyndex scraper.
 * @todo: register the staking contracts
 */
export class Wyndex extends Exchange {
  private options: WyndexOptions
  private localCache: LocalCache

  constructor(options: WyndexOptions) {
    super(WYND)
    this.options = options
    this.localCache = new LocalCache(`astroport-${options.cacheSuffix}`)
  }

  async registerAssets(network: Network) {
    const assets = await this.fetchTopAssets(network)

    for (const assetInfo of assets) {
      await match(assetInfo)
        .with({ cw20: P.select() }, async (_, cw20Info) => {
          await network.registerCw20Info(cw20Info)
        })
        .with({ native: P.select() }, async (_, nativeInfo) => {
          await network.registerNativeAssetInfo(nativeInfo)
        })
        .otherwise((a) => {
          throw new Error(`Unknown asset type ${a}`)
        })
    }

    console.log(
      `Registered ${JSON.stringify(network.assetRegistry.assetRegistry)} assets for ${
        this.name
      } on ${network.networkId}`
    )
  }

  private async fetchAllAssets(network: Network): Promise<CwAssetInfo[]> {
    const assetInfos = await this.fetchAllPairs(network).then((pairs) =>
      pairs.flatMap((pair) => pair.asset_infos)
    )

    return assetInfos.map((assetInfo: WyndexAssetInfo) => this.wyndexInfoToAssetInfo(assetInfo))
  }

  private async fetchTopAssets(network: Network): Promise<CwAssetInfo[]> {
    const assetInfos = await this.fetchTopPairs(network).then((pairs) =>
      pairs.flatMap((pair) => pair.asset_infos)
    )

    return assetInfos.map((assetInfo: WyndexAssetInfo) => this.wyndexInfoToAssetInfo(assetInfo))
  }

  private wyndexInfoToAssetInfo(assetInfo: WyndexAssetInfo) {
    return match<WyndexAssetInfo>(assetInfo)
      .with({ native: P.select() }, (denom) => AssetInfo.native(denom))
      .with({ token: P.select() }, (token) => AssetInfo.cw20(token))
      .exhaustive()
  }

  async registerPools(network: Network) {
    const astroContracts = await this.retrieveAstroContracts()

    if (!astroContracts.generator_address) {
      throw new Error('Could not find generator address')
    }

    const { generator_address: stakingAddress } = astroContracts

    const pairs = await this.fetchTopPairs(network)

    pairs.forEach(({ pair_type, liquidity_token, asset_infos, contract_addr }) => {
      let assetNames
      try {
        // Use the already-registered asset names
        const infos = asset_infos.map(this.wyndexInfoToAssetInfo)
        assetNames = network.assetRegistry.getNamesByInfos(infos)
      } catch (e) {
        if (e instanceof NotFoundError) {
          // TODO
          // if (network.assetRegistry.hasSkipped(token1_address)) {
          //
          // }
        }
        console.error(`Could not resolve assets for pool with addr ${contract_addr}`)
        return
      }

      const poolMetadata = this.poolMetadata(pair_type, assetNames)

      network.poolRegistry.register(new AnsPoolEntry(PoolId.contract(contract_addr), poolMetadata))

      // TODO: this is in the wrong place lol
      const lpTokenName = this.lpTokenName(assetNames)
      network.assetRegistry.register(
        new AnsAssetEntry(lpTokenName, AssetInfo.from(liquidity_token))
      )

      const stakingContract = this.stakingContractEntry(assetNames, stakingAddress)

      network.contractRegistry.register(stakingContract)
    })
  }

  /*  async registerPools(network: Network) {

      const { pools } = await this.fetchPoolList(network)

      pools.forEach(({ pool_type, pool_address, prices: assets }) => {
        const { token1_address, token2_address } = assets

        let assetNames
        try {
          // Use the already-registered asset names
          assetNames = network.assetRegistry.getNamesByDenoms([token1_address, token2_address])
        } catch (e) {
          if (e instanceof NotFoundError) {
            // TODO
            // if (network.assetRegistry.hasSkipped(token1_address)) {
            //
            // }
          }
          console.error(`Could not resolve assets for ${pool_address}`)
          return
        }

        network.poolRegistry.register(
          new AnsPoolEntry(PoolId.contract(pool_address), this.poolMetadata(pool_type, assetNames))
        )
      })
    }*/

  /**
   * @todo we need to be able to resolve the staking contracts
   */
  async registerContracts(network: Network) {
    // const astroContracts = await this.retrieveAstroContracts()
    //
    // if (!astroContracts.generator_address) {
    //   throw new Error('Could not find generator address')
    // }
    //
    // const { generator_address: stakingAddress } = astroContracts
    //
    // const { pools } = await this.fetchPoolList(network)
    //
    // // Export the registered pools and add the staking contract to generator address
    // const contractEntries = network.poolRegistry
    //   .export()
    //   .map((pool) => {
    //     const registeredAddress = match(pool.id)
    //       .with({ contract: P.select() }, (c) => c)
    //       .otherwise(() => {
    //         throw new Error('Unexpected pool id')
    //       })
    //     const matching = pools.find(({ pool_address }) => pool_address === registeredAddress)
    //     if (!matching) {
    //       throw new Error(`Could not find pool with address ${registeredAddress}`)
    //     } else if (!matching.stakeable) {
    //       console.warn(`Pool ${matching.pool_address} is not stakeable`)
    //       // Skip not stakeable pools
    //       return
    //     }
    //
    //     const poolAssets = pool.metadata.assets.sort()
    //
    //     return this.stakingContractEntry(poolAssets, stakingAddress)
    //   })
    //   .filter((e): e is AnsContractEntry => !!e)
    //
    // contractEntries.forEach((entry) => network.contractRegistry.register(entry))
  }

  toAbstractPoolType(poolType: PairType): PoolType {
    return match(poolType)
      .with({ xyk: P.select() }, () => 'ConstantProduct' as const)
      .with({ stable: P.select() }, () => 'Stable' as const)
      .with({ custom: P.select() }, (c) =>
        match(c)
          .with('concentrated', () => 'Weighted' as const)
          .otherwise(() => {
            throw new Error(`Unknown custom type: ${JSON.stringify(c)}`)
          })
      )
      .otherwise(() => {
        throw new Error(`Unknown pool type: ${JSON.stringify(poolType)}`)
      })
  }

  private async fetchAllPairs(network: Network): Promise<PairInfo[]> {
    // Try to get data from the cache
    const cachedPairs = await this.localCache.get<PairInfo[]>(ALL_PAIRS_CACHE_KEY)
    if (cachedPairs) {
      console.log(`Loaded ${cachedPairs.length} pairs from cache`)
      return cachedPairs
    }

    const { factory_address } = await this.retrieveAstroContracts()
    const client = await network.queryClient()

    const factoryQClient = new WyndexFactoryQueryClient(client, factory_address)

    let startAfter: WyndexAssetInfo[] | undefined = undefined
    const allPairs: PairsResponse['pairs'] = []

    do {
      let pairs = []
      try {
        // @ts-ignore
        const { pairs: pairsR } = await factoryQClient.pairs({ limit: 30, startAfter })
        pairs = pairsR
      } catch (e) {
        console.error(e)
        break
      }

      console.log(`Fetched ${pairs.length} pairs`)
      if (pairs.length === 0) {
        break
      }

      allPairs.push(...pairs)
      startAfter = pairs[pairs.length - 1]?.asset_infos
      console.log(`Next startAfter: ${JSON.stringify(startAfter)}`)
    } while (startAfter)
    // Save fetched data to cache
    await this.localCache.set(ALL_PAIRS_CACHE_KEY, allPairs)

    console.log(`Finished scraping all pairs`)

    return allPairs
  }

  private async fetchSortedPairs(network: Network): Promise<PairInfo[]> {
    const allPairs = await this.fetchAllPairs(network)
    const pairAddrToShares = new Map<string, string>()

    for (const { contract_addr } of allPairs) {
      pairAddrToShares.set(contract_addr, await this.pairTotalShare(network, contract_addr))
    }

    // sort the pairs based on their value
    allPairs.sort((a, b) => {
      const aVal = pairAddrToShares.get(a.contract_addr)
      const bVal = pairAddrToShares.get(b.contract_addr)

      if (!aVal || !bVal) {
        throw new Error('Could not find value for pair')
      }

      return Number(aVal) - Number(bVal)
    })

    return allPairs
  }

  private async fetchTopPairs(
    network: Network,
    count: number = TOP_PAIR_COUNT
  ): Promise<PairInfo[]> {
    const cachedTopPairs = await this.localCache.get<PairInfo[]>(TOP_PAIRS_CACHE_KEY)
    if (cachedTopPairs && cachedTopPairs.length === count) {
      console.log(`Loaded ${cachedTopPairs.length} pairs from cache`)
      return cachedTopPairs
    }
    const allPairs = await this.fetchSortedPairs(network)
    const topPairs = allPairs.slice(0, count)

    console.log(`Top pairs: ${topPairs.map((p) => p.contract_addr).join(', ')}`)

    // Save fetched data to cache
    await this.localCache.set(TOP_PAIRS_CACHE_KEY, topPairs)

    return topPairs
  }

  private async pairTotalShare(network: Network, pairAddr: string): Promise<string> {
    if (await this.localCache.hasValue('total_share', pairAddr)) {
      return await this.localCache.getValueUnchecked('total_share', pairAddr)
    }
    const client = await network.queryClient()
    const pairQClient = new WyndexPairQueryClient(client, pairAddr)

    try {
      const { total_share } = await pairQClient.cumulativePrices()
      await this.localCache.setValue('total_share', pairAddr, total_share)
      console.log(`Fetched total share for ${pairAddr}: ${total_share}`)

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100))

      return total_share
    } catch (e) {
      console.warn(`Could not fetch total share for ${pairAddr}: ${e}`)
      return '0'
    }
  }

  private poolMetadata(pairType: PairType, assets: string[]): AbstractPoolMetadata {
    return {
      dex: this.name.toLowerCase(),
      pool_type: this.toAbstractPoolType(pairType),
      assets,
    }
  }
}
