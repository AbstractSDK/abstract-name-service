import { Exchange } from './exchange'
import { AnsAssetEntry, AnsPoolEntry, AssetInfo, PoolId } from '../objects'
import { gql, request } from 'graphql-request'
import { NetworkRegistry } from '../networks/networkRegistry'

const ASTROPORT = 'Astroport'

/*
  private networkToQueryUrl = {
    'phoenix-1': 'https://terra2-api.astroport.fi/graphql',
  }
 */
interface AstroportOptions {
  queryUrl: string
}

export class Astroport extends Exchange {
  private options: AstroportOptions

  constructor(network: NetworkRegistry, options: AstroportOptions) {
    super(ASTROPORT, network)
    this.options = options
  }

  private async fetchPoolList(): Promise<AstroportPoolList> {
    return request(this.options.queryUrl, POOLS_QUERY)
  }

  async retrievePools(): Promise<AnsPoolEntry[]> {
    const { pools, tokens } = await this.fetchPoolList()

    return pools.map(({ pool_type, pool_address, prices: assets }) => {
      const assetAddresses = Object.values(assets).map((asset) => asset.toLowerCase())
      const assetNames = assetAddresses.map(this.tokenAddrToName(tokens))

      return new AnsPoolEntry(
        PoolId.contract(pool_address),
        this.poolMetadata(pool_type, assetNames)
      )
    })
  }

  private poolMetadata(pool_type: string, assets: string[]) {
    return {
      dex: this.dexName.toLowerCase(),
      poolType: this.toAbstractPoolType(pool_type),
      assets,
    }
  }

  async retrieveAssets(): Promise<AnsAssetEntry[]> {
    const { tokens } = await this.fetchPoolList()

    for (const { symbol, tokenAddr } of tokens) {
      // TODO: difference for native??
      this.chain.registerAsset(new AnsAssetEntry(symbol, AssetInfo.from(tokenAddr)))
    }

    return []
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

  toAbstractPoolType(poolType: string): PoolType {
    switch (poolType) {
      case 'xyk':
        return 'constant_product'
      case 'stable':
        return 'stable'
      default:
        throw new Error(`Unknown pool type: ${poolType}`)
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
