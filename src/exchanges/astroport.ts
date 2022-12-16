import { Exchange } from './exchange'
import { AnsAssetEntry, AnsPoolEntry, AssetInfo, PoolId } from '../objects'
import { gql, request } from 'graphql-request'

export class Astroport extends Exchange {
  private networkToQueryUrl = {
    'phoenix-1': 'https://terra2-api.astroport.fi/graphql',
  }

  supportsNetwork = (network: string) => Object.keys(this.networkToQueryUrl).includes(network)

  constructor() {
    super('Astroport', 'terra')
  }
  private async fetchPoolList(
    network: keyof typeof this.networkToQueryUrl
  ): Promise<AstroportPoolList> {
    const listUrl = this.networkToQueryUrl[network]

    return request(listUrl, POOLS_QUERY)
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

  async retrievePools(network: string): Promise<AnsPoolEntry[]> {
    if (!this.supportsNetwork(network)) {
      return Promise.resolve([])
    }
    const { pools, tokens } = await this.fetchPoolList(
      network as keyof typeof this.networkToQueryUrl
    )

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
      dex: this.name.toLowerCase(),
      poolType: this.toAbstractPoolType(pool_type),
      assets,
    }
  }

  async retrieveAssets(network: string): Promise<AnsAssetEntry[]> {
    if (!this.supportsNetwork(network)) {
      return Promise.resolve([])
    }
    const { tokens } = await this.fetchPoolList(network as keyof typeof this.networkToQueryUrl)

    return tokens.map(
      ({ symbol, tokenAddr }) => new AnsAssetEntry(symbol, AssetInfo.from(tokenAddr))
    )
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
