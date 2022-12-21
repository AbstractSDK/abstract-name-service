import { Exchange } from './exchange'
import { AnsAssetEntry, AnsContractEntry, AnsPoolEntry, AssetInfo, PoolId } from '../objects'
import { gql, request } from 'graphql-request'
import { Network } from '../networks/network'

const ASTROPORT = 'Astroport'

interface AstroportOptions {
  queryUrl: string
}

/**
 * Astroport scraper.
 * @todo: register the staking contracts
 */
export class Astroport extends Exchange {
  private options: AstroportOptions

  constructor(options: AstroportOptions) {
    super(ASTROPORT)
    this.options = options
  }

  async registerAssets(network: Network) {
    const { tokens, pools } = await this.fetchPoolList()

    // Register pool tokens
    tokens.forEach(({ symbol, tokenAddr }) => {
      // TODO: difference for native??
      network.assetRegistry.register(new AnsAssetEntry(symbol, AssetInfo.from(tokenAddr)))
    })

    // Register LP tokens using the previously registered pool tokens
    pools
      .filter(({ lp_address }) => lp_address)
      .forEach(({ lp_address, prices: { token1_address, token2_address } }) => {
        const resolvedAssetNames = network.assetRegistry.getNamesByAddresses([
          token1_address,
          token2_address,
        ])

        const lpTokenName = this.lpTokenName(resolvedAssetNames)

        network.assetRegistry.register(new AnsAssetEntry(lpTokenName, AssetInfo.from(lp_address)))
      })
  }

  async registerPools(network: Network) {
    const { pools } = await this.fetchPoolList()

    pools.forEach(({ pool_type, pool_address, prices: assets }) => {
      const { token1_address, token2_address } = assets

      // Use the already-registered asset names
      const assetNames = network.assetRegistry.getNamesByAddresses([token1_address, token2_address])

      network.poolRegistry.register(
        new AnsPoolEntry(PoolId.contract(pool_address), this.poolMetadata(pool_type, assetNames))
      )
    })
  }

  /**
   * @todo we need to be able to resolve the staking contracts
   */
  async registerContracts(network: Network) {
    console.error(`registerContracts not implemented for ${this.name}`)
    return
    // const { pools } = await this.fetchPoolList()
    // pools
    //   .filter(({ stakeable }) => stakeable)
    //   .forEach(({ pool_address, prices: { token1_address, token2_address } }) => {
    //     const resolvedAssetNames = network.assetRegistry.getNamesByAddresses([
    //       token1_address,
    //       token2_address,
    //     ])
    //     const stakingContarctName = AnsName.stakingContract(resolvedAssetNames)
    //
    //     const newEntry = new AnsContractEntry(
    //       this.dexName.toLowerCase(),
    //       stakingContarctName,
    //       pool_address
    //     )
    //     network.contractRegistry.register(newEntry)
    //   })
  }

  toAbstractPoolType(poolType: string): PoolType {
    switch (poolType) {
      case 'xyk':
        return 'ConstantProduct'
      case 'stable':
        return 'Stable'
      default:
        throw new Error(`Unknown pool type: ${poolType}`)
    }
  }

  private async fetchPoolList(): Promise<AstroportPoolList> {
    return request(this.options.queryUrl, POOLS_QUERY)
  }

  private poolMetadata(pool_type: string, assets: string[]): AbstractPoolMetadata {
    return {
      dex: this.name.toLowerCase(),
      pool_type: this.toAbstractPoolType(pool_type),
      assets,
    }
  }

  private tokenAddrToName(tokens: Token[]) {
    return (address: string) => {
      const token = tokens.find(({ tokenAddr }) => tokenAddr === address)
      if (!token) {
        throw new Error(`Could not find token with address ${address}`)
      }
      return token.symbol.toLowerCase()
    }
  }
}

const POOLS_QUERY = gql`
  query Query {
    pools {
      pool_type
      pool_address
      stakeable
      lp_address
      reward_proxy_address
      prices {
        token1_address
        token2_address
      }
    }
    tokens {
      name
      symbol
      tokenAddr
    }
  }
`

interface AstroportPoolList {
  pools: AstroportPool[]
  tokens: Token[]
}

interface AstroportPool {
  pool_type: string
  pool_address: string
  stakeable: boolean
  lp_address: string
  reward_proxy_address: null
  prices: Prices
}

interface Prices {
  token1_address: string
  token2_address: string
}

interface Token {
  name: string
  symbol: string
  tokenAddr: string
}
